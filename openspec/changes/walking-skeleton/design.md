# Design

## Context

The repo has only a README and OpenSpec. The sheetlibrary.com zone already exists in Cloudflare, was set up by hand and has no records. `tkuenzle/detox-browser` has an OpenTofu setup for Cloudflare that we reuse: provider `cloudflare ~> 5`, state in the shared R2 bucket `opentofu-state`, plan on pull requests, apply on `main`.

## Goals / Non-Goals

**Goals:**
- Stack choices that later changes (editor, backend) build on without migrating.

**Non-Goals:**
- Empty placeholder packages. `packages/*` get added when the chord sheet model or the editor needs them.

## Decisions

**React + React Router v8 on Cloudflare Workers.** The user knows React best. React Router v8 (current major since June 2026) can prerender pages now and run server code on Workers later, so adding a backend needs no platform change. TanStack Start was the alternative. It's newer, and stricter route types aren't worth that yet.

**Workers instead of Pages.** Cloudflare recommends Workers for new projects, and the future backend runs there anyway. This differs from detox-browser, which uses Pages.

**tofu creates resources, wrangler deploys and routes.** This follows Cloudflare's suggested split: `cloudflare_worker` in tofu, versions and deployments with wrangler. tofu manages the zone, both workers (without code, so they exist before the first deploy and the pull request token can be scoped to one), the www record and the redirect rule. wrangler uploads code, deploys it and applies everything in `wrangler.jsonc`: worker settings and the `sheetlibrary.com` custom domain. tofu ignores the worker settings (`ignore_changes`), so the two tools never overwrite each other. The custom domain was first in tofu, but Cloudflare only attaches a domain to a worker with a deployment, which needed a manual deploy in between. In wrangler it is attached on deploy, so setup from scratch needs no extra step.

**Zone imported with an `import` block.** The zone ID becomes a resource instead of a variable (unlike detox-browser, where another repo owns the zone). State key: `sheetlibrary/terraform.tfstate`.

**State locking with `use_lockfile`.** OpenTofu's native S3 lock works on R2, which rejects a second conditional write (tested: 412). Applies lock the state, so a local apply can't run at the same time as CI. detox-browser has no lock.

**Previews on a separate worker.** A wrangler environment `preview` deploys to its own worker, `sheetlibrary-preview`. On each pull request, the app is built with `CLOUDFLARE_ENV=preview` and uploaded with `wrangler versions upload --preview-alias pr-<n>`, which creates a stable link per pull request. The Cloudflare Vite plugin picks the environment at build time, so `wrangler --env` is not used. Production is a different worker, so a preview can't touch it, and later the preview worker gets its own bindings instead of production data. Previews need the workers.dev subdomain enabled on the account. Old previews are not cleaned up. Cloudflare keeps the 1000 most recent aliases and deletes the oldest after that.

**Pull request credentials can't reach production.** Pull request jobs get an account-owned token with Editor rights on `sheetlibrary-preview` only (per-Worker scoping, available since September 2026), read rights on zone, DNS and Workers for `tofu plan`, and read-only R2 keys. `tofu plan` runs with `-lock=false`, so it never writes to the state bucket. Jobs on `main` run in a GitHub environment `production` that only `main` can use. It holds a token that can create and edit Workers and edit zone and DNS, plus read/write R2 keys. Both sets use the same secret names, and the environment's secrets take precedence. The account ID is a repo variable, `CLOUDFLARE_ACCOUNT_ID`. detox-browser uses one token for everything.

**Tokens are created by hand.** Cloudflare tokens could be managed in tofu, but tofu would then need rights to create tokens. That is more power than the production token should have.

**One deploy workflow on `main`: tofu apply, then wrangler deploy, then the check.** Running apply on every merge, even when infra didn't change, keeps the order simple. Without changes it does nothing.

**pnpm, TypeScript strict, ESLint + Prettier, Vitest, Playwright, justfile.** These are common defaults. The `justfile` follows detox-browser (`check`, `fix`, `spec-check`), so CI and local runs use the same commands.

## Risks / Trade-offs

- [The first apply could change the hand-made zone settings] → Review the first plan by hand. It should show only an import and additions.
- [Preview links are public] → Fine for a placeholder page. See the proposal's Open Questions.
- [A token can only be scoped to a worker that already exists] → The repo owner runs the first `tofu apply` locally with the production token, then creates the pull request token. Until then, the preview job on the first pull request fails.
- [It's unclear whether one token can combine account-wide Workers read with Editor on one worker] → Check when creating it. Fallback: two pull request tokens, a read-only one for `tofu plan` and one for the preview upload.
- [Bindings in wrangler environments are not inherited, so preview and production config can drift] → No bindings yet. Review both when adding one.
