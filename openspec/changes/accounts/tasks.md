# Tasks

## 1. Cloudflare setup

- [x] 1.1 Create the production and preview D1 databases with `wrangler d1 create` (needs the owner's Cloudflare login). Verify both appear in `wrangler d1 list`
- [ ] 1.2 In `infra/`, import both databases with `import` blocks and `prevent_destroy`, import the `mail.sheetlibrary.com` sending subdomain, and leave all three out of the pull request plan. Verify the pull request plan passes and destroys nothing, and the first apply on main imports all three with no other changes
- [x] 1.3 In `apps/web/wrangler.jsonc`, bind the database as `DB` and add a `send_email` binding, for production and again under `env.preview`, plus the var that turns on the preview's migration route. Verify `just typecheck` sees them in `Env`
- [x] 1.4 Set `BETTER_AUTH_SECRET` on both workers with `wrangler secret put`, and add the first invited address in Cloudflare (owner). Verify with `wrangler secret list` for each worker

## 2. Sign-in on the Worker

- [x] 2.1 Add `better-auth` and its passkey plugin. Check whether it reads D1 directly; add a Kysely D1 dialect only if it doesn't. Verify `pnpm install` and `just typecheck` pass
- [x] 2.2 Make the auth instance per request from `env`, with the email link plugin sending through `send_email` and the passkey plugin taking its domain from the request's host. Route `/api/auth/*` to it in `workers/app.ts`. Verify with unit tests for the routing and for the passkey domain on `sheetlibrary.com` and on a preview host
- [x] 2.3 Generate the schema with the Better Auth CLI into `apps/web/migrations/`. Verify `wrangler d1 migrations apply DB --local` runs, and that an email link from local dev signs in
- [x] 2.4 Turn Cloudflare's refusal of an uninvited recipient into the invite-only note. Verify with a test for the scenario "Uninvited email", using a fake binding that refuses
- [x] 2.5 Add rate limits with database storage, and the per-address count before sending. Verify with a test for the scenario "Too many requests"

## 3. Migrations in CI

- [x] 3.1 Add the preview's migration route: it bundles `apps/web/migrations/`, applies the missing files through `DB`, records them in `d1_migrations`, and answers 404 without the preview var. Verify with tests that a second run changes nothing and that production gets 404
- [ ] 3.2 Call the route from the preview job after `wrangler versions deploy`, and run `wrangler d1 migrations apply DB --remote` in `just deploy` before `wrangler deploy`. Verify this pull request's preview has the tables

## 4. Pages

- [ ] 4.1 Pass `env` in the router context and read the session in a root middleware. Stop prerendering `/`. Verify the home page's tests and e2e still pass
- [ ] 4.2 Add `/sign-in`: an email field with a send button, a passkey button, and notes for a sent link, an uninvited address and too many requests. Add the sign-in words to `docs/ui-text.md`. Verify with tests for the page's notes
- [ ] 4.3 Land an email sign-in on `/account` with the offer to add a passkey, which can be skipped. Verify the scenario "Adding a passkey after an email sign-in" in the browser on local dev
- [ ] 4.4 Add `/account`: the email, the passkeys with add, rename and remove, and sign-out. Send visitors who aren't signed in to `/sign-in`. Verify with an e2e test for the redirect and tests for the page
- [ ] 4.5 Show "Sign in" or the account link in the top bar. Verify with tests for the scenarios "Signed out" and "Signed in"

## 5. Checks on the preview

- [ ] 5.1 On this pull request's preview, sign in with an invited address, and try an uninvited one. Verify the scenarios "First sign-in", "Link used twice" and "Uninvited email", and note how the binding refuses
- [ ] 5.2 On the preview, add a passkey, sign out and sign in with it, then remove it on the account page. Verify the scenarios "Returning on the same device" and "Removing a lost device's passkey"
- [ ] 5.3 Use the pull request token against the production database. Verify Cloudflare rejects it (scenario "Pull request credentials used against the production database")
- [ ] 5.4 Run `just check` and `just spec-check`. Verify both pass

## Workflow follow-up

- Park an issue: once D1 tokens can name one database, let the preview job run wrangler migrations and remove the route.
- After merge, sign in on `https://sheetlibrary.com` with an invited address.
- Close #49 with the pull request. Archive the change after review.
