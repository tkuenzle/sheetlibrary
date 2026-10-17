# Tasks

## 1. Repo tooling

- [ ] 1.1 Set up the pnpm workspace (root `package.json` with `packageManager`, `pnpm-workspace.yaml`, Node LTS pinned) and verify `pnpm install` succeeds
- [ ] 1.2 Add a strict base TypeScript config, ESLint and Prettier, and verify lint and format checks pass on the repo
- [ ] 1.3 Add a `justfile` with `check`, `fix`, `spec-check`, `dev` and `build`, and verify `just spec-check` passes
- [ ] 1.4 Update the CLAUDE.md line saying no stack is chosen, and verify it no longer contradicts the repo

## 2. Web app

- [ ] 2.1 Create `apps/web` with React Router v7 on Workers and a prerendered, very simple placeholder page, and verify `just dev` serves it locally
- [ ] 2.2 Add a Vitest unit test for the page and verify `just check` runs it
- [ ] 2.3 Add a Playwright smoke test against the built app and verify `just check` runs it
- [ ] 2.4 Add a short "Development" section to the README and verify its commands run as written

## 3. Accounts and secrets (manual, repo owner)

- [ ] 3.1 Create or extend a Cloudflare API token with zone, DNS and Workers edit rights for sheetlibrary.com, and verify it can read the zone
- [ ] 3.2 Add `CLOUDFLARE_API_TOKEN`, `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` as GitHub secrets, and verify they are listed in the repo settings
- [ ] 3.3 Enable the workers.dev subdomain on the account and verify it is shown in the dashboard

## 4. Infrastructure

- [ ] 4.1 Add `infra/` with the provider, the R2 backend (key `sheetlibrary/terraform.tfstate`), the account ID variable and `.gitignore`, and verify `tofu init` and `tofu validate` pass
- [ ] 4.2 Import the existing zone with an `import` block and verify `tofu plan` shows only the import, with no changes or deletions
- [ ] 4.3 Add the worker resource and the custom domain for sheetlibrary.com (check `cloudflare_worker` first, use the fallback from design.md if needed), and verify the plan
- [ ] 4.4 Add the www record and a permanent redirect to the apex, and verify the plan

## 5. CI on pull requests

- [ ] 5.1 Add a CI workflow running `just check` and `just spec-check`, and verify a deliberately failing test turns it red
- [ ] 5.2 Add a `tofu plan` job for pull requests that change `infra/`, and verify the plan appears in the run
- [ ] 5.3 Add a preview job (`wrangler versions upload --preview-alias pr-<n>`) that comments the link on the pull request, and verify the link shows the placeholder

## 6. Deploy on merge

- [ ] 6.1 Add a deploy workflow on `main`: tofu apply, then wrangler deploy, then a check that `https://sheetlibrary.com` returns 2xx, and verify a failing check fails the run

## 7. End-to-end

- [ ] 7.1 Merge the first pull request and verify `https://sheetlibrary.com` shows the placeholder and `https://www.sheetlibrary.com/x` redirects to `https://sheetlibrary.com/x`
- [ ] 7.2 Turn on branch protection for `main` with the CI checks required, and verify a red pull request can't be merged
