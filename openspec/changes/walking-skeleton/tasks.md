# Tasks

## 1. Repo tooling

- [x] 1.1 Set up the pnpm workspace (root `package.json` with `packageManager`, `pnpm-workspace.yaml`, Node LTS pinned) and verify `pnpm install` succeeds
- [x] 1.2 Add a strict base TypeScript config, ESLint and Prettier, and verify lint and format checks pass on the repo
- [x] 1.3 Add a `justfile` with `check`, `fix`, `spec-check`, `dev` and `build`, and verify `just spec-check` passes
- [x] 1.4 Update the CLAUDE.md line saying no stack is chosen, and verify it no longer contradicts the repo

## 2. Web app

- [x] 2.1 Create `apps/web` with React Router v8 on Workers and a prerendered, very simple placeholder page, and verify `just dev` serves it locally
- [x] 2.2 Add a Vitest unit test for the page and verify `just check` runs it
- [x] 2.3 Add a Playwright smoke test against the built app and verify `just check` runs it
- [x] 2.4 Add a short "Development" section to the README and verify its commands run as written

## 3. Accounts and secrets (manual, repo owner)

- [x] 3.1 Create a production token (create and edit Workers, edit zone and DNS) and read/write R2 keys, and verify the token can edit DNS
- [ ] 3.2 Add the repo variable `CLOUDFLARE_ACCOUNT_ID` and the production credentials as secrets of a `production` environment limited to `main`, named `CLOUDFLARE_API_TOKEN`, `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`, and verify they are listed in the repo settings
- [x] 3.3 Enable the workers.dev subdomain on the account and verify it is shown in the dashboard

## 4. Infrastructure

- [x] 4.1 Add `infra/` with the provider, the R2 backend (key `sheetlibrary/terraform.tfstate`), the account ID variable and `.gitignore`, and verify `tofu init` and `tofu validate` pass
- [x] 4.2 Import the existing zone with an `import` block and verify `tofu plan` shows only the import, with no changes or deletions
- [x] 4.3 Add the workers `sheetlibrary` and `sheetlibrary-preview` in tofu and the custom domain for sheetlibrary.com in `wrangler.jsonc`, and verify the plan and a deploy
- [x] 4.4 Add the www record and a permanent redirect to the apex, and verify the plan
- [x] 4.5 Run the first `tofu apply` locally with the production credentials (repo owner), and verify both workers exist and `tofu plan` shows no changes
- [ ] 4.6 Create the pull request token (Editor on `sheetlibrary-preview` only, read on zone, DNS and Workers) and read-only R2 keys, add them as secrets of a `preview` environment with the same names, and verify uploading a version to `sheetlibrary` with them is rejected (manual, repo owner; split into two tokens per design.md if needed)

## 5. CI on pull requests

- [x] 5.1 Add a CI workflow running `just check` and `just spec-check`, and verify a deliberately failing test turns it red
- [ ] 5.2 Add a `tofu plan -lock=false` job for pull requests that change `infra/`, using the pull request credentials, and verify the plan appears in the run
- [ ] 5.3 Add the wrangler environment `preview` (worker `sheetlibrary-preview`) and a preview job (build with `CLOUDFLARE_ENV=preview`, then `wrangler versions upload --preview-alias pr-<n>`) that shows the link on the pull request as a `preview` deployment, and verify the link shows the placeholder

## 6. Deploy on merge

- [ ] 6.1 Add a deploy workflow on `main`, running in the `production` environment: tofu apply, then wrangler deploy, then a check that `https://sheetlibrary.com` returns 2xx, and verify a failing check fails the run

## 7. End-to-end

- [ ] 7.1 Merge the first pull request and verify `https://sheetlibrary.com` shows the placeholder and `https://www.sheetlibrary.com/x` redirects to `https://sheetlibrary.com/x`
- [ ] 7.2 Turn on branch protection for `main` with the CI checks required, and verify a red pull request can't be merged
