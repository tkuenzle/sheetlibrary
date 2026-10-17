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

**tofu owns infrastructure, wrangler owns code.** tofu manages the zone, both workers (without code), the custom domain and the www redirect. wrangler uploads code and deploys versions. Each tool only touches its own resources, so they never overwrite each other.

**Zone imported with an `import` block.** The zone ID becomes a resource instead of a variable (unlike detox-browser, where another repo owns the zone). State key: `sheetlibrary/terraform.tfstate`.

**Previews on a separate worker.** A wrangler environment `preview` deploys to its own worker, `sheetlibrary-preview`. On each pull request, `wrangler versions upload --env preview --preview-alias pr-<n>` creates a stable link per pull request. Production is a different worker, so a preview can't touch it, and later the preview worker gets its own bindings instead of production data. Previews need the workers.dev subdomain enabled on the account. Old previews are not cleaned up. Cloudflare keeps the 1000 most recent aliases and deletes the oldest after that.

**Pull request credentials can't reach production.** Pull request jobs get an account-owned token with Editor rights on `sheetlibrary-preview` only (per-Worker scoping, available since September 2026), read rights on zone, DNS and Workers for `tofu plan`, and read-only R2 keys. `tofu plan` runs with `-lock=false`, so it never writes to the state bucket. Jobs on `main` run in a GitHub environment `production` that only `main` can use. It holds a token that can create and edit Workers and edit zone and DNS, plus read/write R2 keys. Both sets use the same secret names, and the environment's secrets take precedence. detox-browser uses one token for everything.

**Tokens are created by hand.** Cloudflare tokens could be managed in tofu, but tofu would then need rights to create tokens. That is more power than the production token should have.

**One deploy workflow on `main`: tofu apply, then wrangler deploy, then the check.** Running apply on every merge, even when infra didn't change, keeps the order simple. Without changes it does nothing.

**pnpm, TypeScript strict, ESLint + Prettier, Vitest, Playwright, justfile.** These are common defaults. The `justfile` follows detox-browser (`check`, `fix`, `spec-check`), so CI and local runs use the same commands.

## Risks / Trade-offs

- [The provider's `cloudflare_worker` resource may not work as expected, i.e. creating a worker without code] → Check this first. Fallback: define the custom domain in `wrangler.jsonc`, so tofu only manages the zone and the redirect.
- [The first apply could change the hand-made zone settings] → Review the first plan by hand. It should show only an import and additions.
- [Preview links are public] → Fine for a placeholder page. See the proposal's Open Questions.
- [A token can only be scoped to a worker that already exists] → The repo owner runs the first `tofu apply` locally with the production token, then creates the pull request token. Until then, the preview job on the first pull request fails.
- [It's unclear whether one token can combine account-wide Workers read with Editor on one worker] → Check when creating it. Fallback: two pull request tokens, a read-only one for `tofu plan` and one for the preview upload.
- [Bindings in wrangler environments are not inherited, so preview and production config can drift] → No bindings yet. Review both when adding one.
