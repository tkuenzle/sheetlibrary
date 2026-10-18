# Proposal

## Why

Before we build the editor, we want the full path from a pull request to sheetlibrary.com working. Then every later change, including editor spikes, gets checks and a shareable link from day one.

## What Changes

- Set up the repo as a pnpm monorepo with TypeScript (strict), linting, formatting and tests, driven by a `justfile`.
- Add `apps/web`: a React Router v8 app on Cloudflare Workers that shows a very simple placeholder page.
- Run checks on every pull request: lint, format, typecheck, unit tests, build, end-to-end tests and OpenSpec validation.
- Deploy a preview of every pull request and post its link on the pull request.
- Deploy to sheetlibrary.com on every merge to `main`, then check that the site responds.
- Manage the Cloudflare setup with OpenTofu in `infra/`, the same way as in `tkuenzle/detox-browser`. This repo owns the sheetlibrary.com zone, which already exists and gets imported. www.sheetlibrary.com redirects to sheetlibrary.com.

## Capabilities

### New Capabilities

- `ci-pipeline`: automatic checks on every pull request.
- `site-hosting`: where the site is served and how it gets deployed, for production and for pull request previews.
- `infrastructure`: Cloudflare resources defined in code, planned on pull requests and applied on merge.

### Modified Capabilities

None.

## Impact

- New: root workspace config, `justfile`, `apps/web`, `infra/`, `.github/workflows/`.
- Cloudflare: the sheetlibrary.com zone comes under OpenTofu control. A production worker, a separate preview worker and custom domains are added.
- One-time manual setup: two sets of credentials (pull request ones that can only touch the preview worker, full ones in a GitHub `production` environment that only `main` can use), the workers.dev subdomain on the account, and branch protection on `main`.
- Not in this change: chord sheet model, editor, design, dependency updates (tracked in a separate issue).

## Open Questions

- Should preview links be public, or protected (for example with Cloudflare Access)?
- If the check after a production deploy fails, should it roll back automatically or only fail the run?
- Should the zone force HTTPS and set HSTS?
- Pull requests from forks get no secrets, so no preview. Is that fine?
