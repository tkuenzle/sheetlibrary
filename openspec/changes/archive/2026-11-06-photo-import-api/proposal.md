# Proposal

## Why

Photo import (#93) needs a vision model behind the site. Calling it from the Worker is a stack change, and it holds the open questions: the Workers CPU limit, a call that can take two minutes, and whether the prompt, edited after the spike, still reads real pages. This change settles them before #93 builds the UI.

## What Changes

- `POST /api/photo-import` takes the photos of one song, in page order, and answers with a chord sheet: its content, and the title and artist read from the page. It does not create a sheet; the browser does that through `/api/sheets`, as the other imports do.
- The Worker reads the model's answer with `readPhotoAnswer`. The answer's format stays internal and never reaches the browser.
- Only signed-in people can use it.
- The model sits behind an interface, with two kinds: Claude through Cloudflare AI Gateway, and a fake that answers with a public-domain song. Local dev and CI use the fake.
- When the browser's request goes away, the Worker stops the call to the model.
- The photos are not kept. The AI gateway is defined in `infra/`, with logs off.
- Production and previews each get their own API key and gateway token, set as secrets by hand. The preview key has a small spending cap.
- On a preview: measure the CPU time per request, check that a 2-minute call gets through, and run the prompt on the owner's real pages.

No change in the app's pages. The UI is #93.

## Capabilities

### New Capabilities

- `photo-import`: reading photos of a song into a chord sheet on the server: the endpoint, who can use it, the model behind it and what is kept.

### Modified Capabilities

- `infrastructure`: the AI gateway joins what is defined in this repository.

## Impact

- `apps/web`: a new route and its handler, the model client and the fake, `@anthropic-ai/sdk` as a dependency, and `wrangler.jsonc` (a var for the gateway, the model choice, the API key and the gateway token as required secrets).
- `infra/`: the AI gateway. The Cloudflare tokens for the pipeline need access to AI Gateway.
- Cloudflare and Anthropic, by hand: two API keys in separate workspaces with spending caps, and two gateway tokens, set as Worker secrets.
- Maybe Workers Paid (#71), if a request needs more than 10 ms of CPU.

## Open Questions

- Limits on the photos: how many per song (the canvas proposes 10), how large, and which image types. #93 shrinks them first, so the server could only check the count and the total size.
- What the endpoint answers when the model fails, refuses or runs out of tokens. One error for all, or different ones so #93 can say "Try again" or "No song found on the photos"?
- An answer with no lines at all, such as a photo of a cat: an empty sheet, or an error?
