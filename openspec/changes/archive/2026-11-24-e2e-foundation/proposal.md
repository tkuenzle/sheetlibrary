# Proposal

## Why

All e2e tests share one account. It is kept from run to run, and every run adds sheets to it, so pages get slower over time. Each spec also writes its own helpers, and timing is set with sleeps against a real server. This causes the flaky tests in #180, and every new spec repeats it. This change builds the shared base. #180 then fixes the flaky tests on top of it.

## What Changes

- Each e2e run starts with an empty local database of its own. Local dev data is left alone.
- Each worker slot signs in its own account by email once per run. This replaces the `setup` project and the session kept between runs.
- One fixtures module (`e2e/fixtures.ts`) holds what specs share:
  - signing in
  - making sheets and collections
  - slowing a request, holding it until the test lets it go, or answering it at once
  - waiting for motion to end
- Every spec uses the fixtures in place of its own copies. The scenarios stay as they are.
- The number of workers is capped, so sign-ins stay under the email limit.
- CI keeps a trace of each failed or retried test, and lists flaky tests by name.

## Capabilities

### New Capabilities

### Modified Capabilities
- `ci-pipeline`: e2e tests start clean and don't share an account across workers, and CI keeps what's needed to look into a failed or flaky test.

## Impact

- `apps/web/e2e/`: new `fixtures.ts`. Every spec that signs in or makes data changes. `auth.setup.ts` goes away.
- `apps/web/playwright.config.ts`: no `setup` project, a worker cap, traces, and an app server that resets its database and is never reused.
- `apps/web/vite.config.ts`: the database's location can be set by an environment variable.
- `.github/workflows/ci.yml`: uploads traces and writes flaky tests to the run's summary.
- No change to the app's own code.

## Open Questions

- Should the phone project run only the tests that depend on the layout (a tag), rather than nearly all of them?
- Should a worker's tests also be kept apart from each other, for example with an account per file, if lists within a run still grow too long?
