# Design

## Context

- The app server for the tests is `vite preview` of the production build. Its local D1 lives in `apps/web/.wrangler/state`, the same place `just dev` uses. `just e2e` migrates it first and never empties it.
- Sign-in emails are limited to 10 per visitor per hour. Locally every request comes from the same visitor. Better Auth keeps the counts in D1, so an empty database also starts the counts at 0.
- `auth.setup.ts` signs in once and keeps the session in `playwright/.auth/user.json` across runs. 12 specs use it with `test.use({ storageState: authFile })`. Two tests open a second context with the same session, and one signs out with an empty state.
- Playwright starts its web servers before any global setup, so a reset in a global setup would come too late.
- The design page's tests use the dev server, and the editor's tests use the harness.

## Goals / Non-Goals

**Goals:**
- No e2e test depends on data from an earlier run, or on another worker's data.
- One copy of each shared helper.

**Non-Goals:**
- Rewriting the flaky tests, or changing what any test checks (#180).
- `failOnFlakyTests` (#180).
- Splitting the phone project (open question in the proposal).

## Decisions

### The app server's command resets its own database

`vite.config.ts` passes `persistState: { path }` to the Cloudflare plugin when `E2E_STATE_DIR` is set. Otherwise it keeps the default. The app server's `webServer` command then empties `.wrangler/e2e-state`, applies the migrations there (`wrangler d1 migrations apply --local --persist-to`), and starts `vite preview` with `E2E_STATE_DIR` set. That server is never reused, so a server left running can't skip the reset. If the port is taken, the run stops with Playwright's own error.

The dev server for the design page gets the same, in `.wrangler/e2e-dev-state`: the root asks who is signed in, so it needs a migrated database too. The harness server isn't reused either. A server left running on these ports can belong to another worktree, and then the run tests that worktree's build. One had been running for 6 days.

Alternative: empty `.wrangler/state` itself. That would wipe the person's local dev data.

### One account per worker slot, signed in by email

A worker-scoped fixture signs in through the real magic link, as `auth.setup.ts` did (`slotAccount()`). It keeps the session in `playwright/.auth/slot-<parallelIndex>.json`. Before signing in, it checks whether that file's session still works (`/api/auth/get-session`). After a failure, Playwright starts a new worker in the same slot, and that worker reuses the account rather than sending another email. A session from an earlier run fails the check, because the database is new.

The chromium and phone projects share slots. A slot runs one worker at a time, so two workers never use one account at once.

Worker fixtures only start when a test asks for them, so a run with no signed-in tests sends no email.

Alternatives:
- Seed users and sessions straight into D1. That depends on how Better Auth stores and signs sessions.
- A sign-in route for tests, or a switch that turns the limit off. That adds an auth path to the app.

### Specs ask to be signed in with an option

`e2e/fixtures.ts` exports `test` and `expect`. An option fixture `signedIn` (default `false`) sets `storageState` to the slot's session when it is `true`. Specs replace `test.use({ storageState: authFile })` with `test.use({ signedIn: true })`. A test that needs the session for a second context gets it from an `account` fixture. A signed-out group inside a signed-in file uses `test.use({ signedIn: false })`, since `signedIn` decides the storage state.

### Workers are capped at 7

`workers: Math.min(7, half the CPUs)`, which is Playwright's default with a cap. 7 slots, the test that signs in a new account by itself, and the one that signs in a second account make 9. Better Auth allows the 10th, so one is left to spare. CI has 2.

### Two workers, tested with a second account

The scenario "Two workers at once" signs in a second slot's account in the same test, makes a sheet with each, and checks that one list doesn't show the other's. Making two real workers meet would depend on timing, which this change removes. It runs on one project only, and its slot is `other-<parallelIndex>`, so two workers never sign in the same one at once.

"A second run" checks that the worker's account was made after the run started. `playwright.config.ts` sets `E2E_RUN_STARTED` once in the main process, and the workers inherit it.

### Network helpers

Each one is a fixture that wraps `page.route`:
- `delay(url, ms)` slows a request, as `holdBack` does today. It stays so specs can move over unchanged.
- `hold(url)` holds matching requests until the test calls `release()`.
- `answerAtOnce(url)` keeps the first answer for each address, and answers later requests from memory without waiting for the server.

Only `delay` gets users in this change. `hold` and `answerAtOnce` are for #180. A small spec, `e2e/fixtures.spec.ts`, checks each against the app, so they work before #180 relies on them.

### Waiting for motion

`settled(locator)` waits until every animation on the element and its descendants has finished (`getAnimations({ subtree: true })`, then each one's `finished`). With reduced motion it returns at once.

### CI evidence

- `trace: "on-first-retry"` and `screenshot: "only-on-failure"`.
- In CI, a JSON reporter writes next to the `github` reporter.
- A step that always runs writes the titles of flaky and failed tests to `$GITHUB_STEP_SUMMARY`.
- `actions/upload-artifact` uploads `apps/web/test-results` and ignores a missing folder.

## Risks / Trade-offs

- [Within a run, a slot's lists still grow: up to about 300 tests write to 2 accounts in CI] → Much less than across runs. An account per file is an open question in the proposal.
- [A machine with more than 7 workers' worth of CPUs runs no faster] → Rare. Seeding accounts is the fallback if the cap starts to pinch.
- [Moving 12 specs at once touches many files] → It's mechanical: imports, `test.use` and helper calls. The scenarios don't change.

## Migration Plan

Local runs need no step: the old `playwright/.auth/user.json` is no longer read and can be deleted. The local dev database is not touched. Rollback is reverting the PR.
