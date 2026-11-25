# Proposal

## Why

Most full e2e runs fail a few tests, a different few each time. CI retries once, which hides it. Two runs on `main` after #181 failed one test each, both of them tests whose data has to come within the app's set wait (150ms for a page, 200ms for a dialog). On a busy machine the server, or the browser, misses that wait. Other tests measure motion mid-way, or poll for a state that shows only briefly.

## What Changes

- Tests that measure motion wait for its animations to end first. The rail's width test is one.
- Tests of a brief state, like "Searching…", hold its data while they check it, rather than polling for it.
- Timing in a test only makes data late. Where a test needs data quickly and its scenario allows a first visit, the data is answered from memory.
- Tests whose data must still come within the set wait are tagged and run in projects of their own, after the other tests, one at a time.
- In CI, a test that passes only on its retry fails the run. Its trace is still kept.

## Capabilities

### New Capabilities

### Modified Capabilities
- `ci-pipeline`: a flaky e2e test fails the run, and e2e tests don't depend on the server answering in time.

## Impact

- `apps/web/playwright.config.ts`: projects for the tagged tests, `grepInvert` on the others, `failOnFlakyTests` in CI.
- `apps/web/e2e/`: `library.spec.ts`, `waiting.spec.ts`, `page-moves.spec.ts` and `loading.spec.ts`.
- A run takes a little longer, since the tagged tests run one at a time.
- No change to the app's own code.

