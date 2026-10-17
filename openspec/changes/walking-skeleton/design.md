# Design

## Context

The repo has only a README and OpenSpec. The sheetlibrary.com zone already exists in Cloudflare, was set up by hand and has no records. `tkuenzle/detox-browser` has an OpenTofu setup for Cloudflare that we reuse: provider `cloudflare ~> 5`, state in the shared R2 bucket `opentofu-state`, plan on pull requests, apply on `main`.

## Goals / Non-Goals

**Goals:**
- Stack choices that later changes (editor, backend) build on without migrating.

**Non-Goals:**
- Empty placeholder packages. `packages/*` get added when the chord sheet model or the editor needs them.

## Decisions

**React + React Router v7 on Cloudflare Workers.** The user knows React best. React Router v7 can prerender pages now and run server code on Workers later, so adding a backend needs no platform change. TanStack Start was the alternative. It's newer, and stricter route types aren't worth that yet.

**Workers instead of Pages.** Cloudflare recommends Workers for new projects, and the future backend runs there anyway. This differs from detox-browser, which uses Pages.

**tofu owns infrastructure, wrangler owns code.** tofu manages the zone, the worker itself (without code), the custom domain and the www redirect. wrangler uploads code and deploys versions. Each tool only touches its own resources, so they never overwrite each other.

**Zone imported with an `import` block.** The zone ID becomes a resource instead of a variable (unlike detox-browser, where another repo owns the zone). State key: `sheetlibrary/terraform.tfstate`.

**Previews with Workers preview aliases.** On each pull request, `wrangler versions upload --preview-alias pr-<n>` creates a stable link per pull request without touching production. This needs the workers.dev subdomain to be enabled on the account.

**One deploy workflow on `main`: tofu apply, then wrangler deploy, then the check.** Running apply on every merge, even when infra didn't change, keeps the order simple. Without changes it does nothing.

**pnpm, TypeScript strict, ESLint + Prettier, Vitest, Playwright, justfile.** These are common defaults. The `justfile` follows detox-browser (`check`, `fix`, `spec-check`), so CI and local runs use the same commands.

## Risks / Trade-offs

- [The provider's `cloudflare_worker` resource may not work as expected, i.e. creating a worker without code] → Check this first. Fallback: define the custom domain in `wrangler.jsonc`, so tofu only manages the zone and the redirect.
- [The first apply could change the hand-made zone settings] → Review the first plan by hand. It should show only an import and additions.
- [Preview links are public] → Fine for a placeholder page. See the proposal's Open Questions.
