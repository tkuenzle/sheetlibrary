# Tasks

## 1. Setup

- [x] 1.1 Add `@anthropic-ai/sdk` to `apps/web` and check that a build that imports it runs in workerd under `just dev`; verify with `just build` and note the bundle growth in the pull request
- [x] 1.2 In `wrangler.jsonc`, add the `enable_request_signal` flag, `PHOTO_MODEL` (`claude`) and `PHOTO_GATEWAY_URL` to production and the preview, and `ANTHROPIC_API_KEY` and `PHOTO_GATEWAY_TOKEN` to both lists of required secrets; verify with `pnpm --filter web cf-typegen` and `just typecheck`
- [x] 1.3 Set `PHOTO_MODEL=fake` for local dev and the end-to-end servers, and check that it overrides the config there; add it to the README's `.dev.vars` line; verify by reading `env.PHOTO_MODEL` under `just dev` and `just e2e`

## 2. The models

- [x] 2.1 Add the `PhotoModel` type and the fake in `app/photos/`, answering "Amazing Grace" in the answer format after an optional `PHOTO_FAKE_DELAY_SECONDS` and stopping when its signal aborts; verify with a test that `readPhotoAnswer` gives a sheet with the title "Amazing Grace", its sections and chords, and a test that an abort ends the wait
- [x] 2.2 Add the Claude model: SDK client on the gateway URL with the gateway token in `cf-aig-authorization`, `claude-opus-5-5`, effort `low`, `max_tokens` 64000, the prompt as system, "Page n" and the base64 image per page, `fallbacks: "default"`, streamed with `finalMessage()`, the signal passed on, and an error for any stop but `end_turn`; verify with tests on a stubbed `fetch` for the request body and headers, a refusal and an abort
- [x] 2.3 Pick the model from `PHOTO_MODEL`, failing on any other value; verify with a test for `claude`, `fake` and an unknown value

## 3. The endpoint

- [x] 3.1 Add `handlePhotoImport` in `app/photos/photo-import.server.ts`: refuse without a session before reading the body, check the `Origin`, read the `photo` fields in order, call the model with `request.signal`, answer `{ title?, artist?, content }`; verify with tests for each scenario in the `photo-import` spec except the gateway's logs
- [x] 3.2 Add the route `api/photo-import` in `routes.ts` and `routes/api.photo-import.ts`; verify with an end-to-end test that a signed-in request with two photos gets "Amazing Grace" and leaves the library unchanged, and that one without a session gets `401`

## 4. Infrastructure

- [x] 4.1 Create the gateway `sheetlibrary` by hand with logs off (authentication stays on), then add `cloudflare_ai_gateway` with an `import` block to `infra/`; verify with `just tofu-plan` showing an import and no other change to it
- [x] 4.2 Give the pipeline's Cloudflare tokens access to AI Gateway: read for the pull request plan, edit for apply on merge; verify with the plan on the pull request
- [ ] 4.3 Create the production and preview API keys in separate Anthropic workspaces, each with a monthly spending cap, and a gateway token for each Worker; set them with `wrangler secret put ANTHROPIC_API_KEY` and `wrangler secret put PHOTO_GATEWAY_TOKEN` on `sheetlibrary` and `sheetlibrary-preview`; verify with `wrangler secret list` on both Workers

## 5. Checks on the preview

- [x] 5.1 Send the spike's 7-page song to the preview and read its CPU time in Workers Logs; record it in `docs/photo-import-spike.md`, and if it is over 10 ms, stop and decide with the owner on Workers Paid (#71)
- [ ] 5.2 Set the preview to the fake with a 120-second delay, check that the answer arrives, then set it back to Claude; record the result in `docs/photo-import-spike.md`
- [x] 5.3 Stop a request while the model reads, and check in the gateway's analytics or the Anthropic console that the call ended early; record it in `docs/photo-import-spike.md`
- [ ] 5.4 Run the owner's spike songs through the preview, check them against the spike's bar (stacked verses as one section each, `artist` only for a performer, and the three untested rules), and record the counts in `docs/photo-import-spike.md`; fix the prompt and its tests if a rule fails
- [ ] 5.5 Check in the gateway that no log holds a request; verify by reading its logs page after 5.4

## Workflow follow-up

- Archive the change after review.
- #93 builds the UI on this endpoint.
