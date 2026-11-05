# Design

## Context

`readPhotoAnswer` and `PHOTO_ANSWER_PROMPT` are in `chordsheet` (#37). The sheets API (`app/sheets/sheets-api.server.ts`) shows the pattern for an endpoint: plain functions from a request to a response, behind a thin route, with the user's id from `sessionContext`. The Worker runs on Workers Free, which allows 10 ms of CPU per request; time spent waiting on a fetch doesn't count. `infra/` defines the Workers and the databases; secrets are set by hand.

## Goals / Non-Goals

**Goals:**
- One rule for imports: an import takes its own kind of input and returns a chord sheet. Internal formats stay on the server.
- Answer the stack questions on a real preview before #93 starts.

**Non-Goals:**
- Choosing the final model or photo size. That is #102.
- Shrinking the photos, progress and the dialog. That is #93.
- Limits per account. That is #101.

## Decisions

**The handler is a plain function, like the sheets API.** `handlePhotoImport(request, env, userId, model)` in `app/photos/photo-import.server.ts` answers with a `Response`; `routes/api.photo-import.ts` only wires it up. The model is passed in, so tests give it the fake.

**Photos come as `multipart/form-data`, one `photo` field per page, in order.** The photos stay binary, so the browser does no base64 and the body is a third smaller than JSON. A form on another site can also post multipart, so the handler checks that the `Origin` header is the site's own; the sheets API gets the same protection by requiring JSON.

**The answer has the envelope's names: `{ title?, artist?, content }`.** That is what `readPhotoAnswer` returns, so #93 can pass it to `/api/sheets` as it is. Not signed in is `401`, as in the sheets API.

**The model is a function from photos to answer text.** `PhotoModel = (photos, signal) => Promise<string>`. The handler reads the text with `readPhotoAnswer`, so the fake goes through the same reader as Claude.

**Claude through the Anthropic SDK, streamed.** `@anthropic-ai/sdk` with `baseURL` set to the gateway and the key from the `ANTHROPIC_API_KEY` secret. The SDK parses the stream and types the request; a hand-written `fetch` would redo both.
- `claude-opus-5-5` at effort `low`, as #93 says, with thinking left at its default. Thinking text is omitted by default, so the stream carries little besides the answer.
- `max_tokens` 64000. The system prompt is `PHOTO_ANSWER_PROMPT`. The user message has, for each page, the text "Page n" and then the image as base64, with the file's type.
- Streaming, with `finalMessage()`, because a hard song takes up to two minutes and a request that sends nothing for that long can be cut off.
- `fallbacks: "default"` with the `server-side-fallback-2026-07-01` beta: if Opus refuses, the API runs the request again on another model in the same call. Only an answer that ends with `end_turn` is read; any other stop is an error.

**The browser's abort reaches the model.** The handler passes `request.signal` to the SDK. Workers fires that signal when the client goes away only with the `enable_request_signal` compatibility flag, so it is added to `wrangler.jsonc`.

**One AI gateway, created by hand and imported.** `cloudflare_ai_gateway` named `sheetlibrary`, with logs off. Previews need it before the change is merged, and `infra/` only applies on merge, so it is created by hand first and imported, as the databases were. It holds no data, so unlike the databases it stays in the pull request plan. Production and previews share it; their keys keep the spending apart. The Worker gets its URL from a var, `PHOTO_GATEWAY_URL`. The AI binding's `gateway().getUrl()` was the other choice, but the binding always runs remotely, also in local dev, which CI can't do.

**The gateway needs a token.** New gateways only take requests with a gateway token, and this can't be turned off. The Worker sends it in the `cf-aig-authorization` header, from the `PHOTO_GATEWAY_TOKEN` secret, next to the API key. Production and previews each have their own token, like their keys.

**`PHOTO_MODEL` picks the model: `claude` or `fake`.** Production and previews set `claude` in `wrangler.jsonc`, with `ANTHROPIC_API_KEY` and `PHOTO_GATEWAY_TOKEN` as required secrets, so a deploy without them fails. Local dev sets `fake` in `.dev.vars`, and the end-to-end servers set it in their environment. Any other value is an error, so nothing falls back to the fake by accident.

**The fake answers with "Amazing Grace".** It is in the public domain, and the app already uses it as the editor's seed song. Its answer is written by hand in the answer format, with sections and chords. The spike's public-domain song is with the owner and can replace it later. The fake can wait before answering, with `PHOTO_FAKE_DELAY_SECONDS`, for the timeout check and for #93's progress; it stops waiting when the signal aborts.

**Base64 with `Uint8Array.prototype.toBase64()`.** It is native, so it costs the least CPU. The CPU time is measured on the preview with the 7-page song from the spike.

## Risks / Trade-offs

- [A request needs more than 10 ms of CPU] → Move to Workers Paid (#71), which open sign-up needs anyway.
- [`request.signal` doesn't fire on the preview] → The call runs to its end and costs up to about 30 cents; the spending cap limits it. Found by a check on the preview.
- [The preview key and gateway token are readable by code in any pull request from this repository] → Only people who can push get a preview. The key has a small cap, and both can be revoked without touching production.
- [The SDK doesn't run in workerd, or is large] → Checked in the first task, before anything is built on it.
- [The fallback model answers worse than Opus] → It runs only after a refusal, which songbook pages shouldn't cause. #102 can count it.

## Migration Plan

1. Before the pull request's first preview: create the gateway by hand, create both API keys with their caps and a gateway token for each Worker, set them as secrets on both Workers, and give the pipeline's Cloudflare tokens access to AI Gateway.
2. On merge, `infra/` imports the gateway and production deploys with its key.
3. Rollback: revert the pull request. Nothing calls the endpoint until #93.
