# Design

## Context

- A page waits up to 150ms (`HEAD_START`) for its data before it shows with bars. The loading bar and "Searching…" show after 200ms (`SLOW_WAIT`). Both count from the start of the page load, so fetching `/__manifest` and the route's code counts too.
- #181 added `hold()`, `answerAtOnce()` and `settled()` to `e2e/fixtures.ts`. `answerAtOnce()` answers from memory only an address it has seen once. A page opened with `page.goto` is rendered by the server and makes no `.data` request.
- Making data late is safe under load, since load only makes it later. Needing data in time is not. These tests need data in time:

  | Test | Why it needs data in time | From memory? |
  |---|---|---|
  | `page-moves`: "raises a sheet from its row, and drops it on Back" | The title moves into Recent only if the fresh list comes within 150ms | Yes. The sheet is in Recent before the first visit |
  | `page-moves`: "drops a sheet onto the fresh list when it comes quickly" | Same, and Recent must show the sheet just opened | No. An answer from before the sheet was opened lacks it |
  | `page-moves`: "raises a sheet whose code is slow to load" | 80ms + 80ms of slowed code must still fit before the bar at 200ms | No. The slowed code is what it checks |
  | `loading`: "shows no bars for a quick page", with and without a move | The collection's data within 150ms | Yes, on a second visit |
  | `loading`: "shows no bars when the collections come quickly" | The dialog's list within 200ms | Yes, on a second opening |

## Goals / Non-Goals

**Non-Goals:**
- Changing `HEAD_START`, `SLOW_WAIT` or anything else in the app.
- The seven tests #180 lists as failing only under load. They passed in two full runs here. `failOnFlakyTests` names any that still fail.
- Replacing the slow `delay()` calls of 1 second or more. They only make data late.

## Decisions

### Tagged tests run in projects of their own, after the others

The tests in the table get the tag `@timing`. `chromium` and `phone` skip them with `grepInvert`. Two more projects run only them, on the same devices: `timing-chromium` and `timing-phone`, each with `workers: 1`. `timing-chromium` depends on `chromium` and `phone`, and `timing-phone` depends on `timing-chromium`. So they start once every other test has finished, and never run at the same time.

Alternatives:
- Control the page's clock (`page.clock`). It also fakes `setTimeout`, which the move code itself uses (`nextTask()` in `page-moves.ts`), while animations keep real time. The tests would no longer check what people get.
- A second `playwright test` call for the tagged tests. Every server would start twice.
- A hook in the app to see what the loader decided. That adds a test path to the app.

### Answers from memory after a first visit

Where the table says yes, the test sets up `answerAtOnce()`, reaches the page once by a move inside the app, and then takes the step it checks. No new helper. The Back test reaches Sheets from another page through the navigation, not with `page.goto`. The collection is opened, left through the navigation, and opened again, so the second opening isn't a step back. The dialog is opened, closed and opened again.

These tests are still tagged. Without the server, the browser still has to get from the click to the loader within the wait.

### Brief states and motion

- "keeps the bar away during a slow search" holds `/sheets.data` with `hold()`. Once "Searching…" shows, it checks the bar is absent. Both use the same 200ms timer, so the bar would show by then if it were going to. Then it releases the data and expects "1 sheet".
- "lists the collections, and opens one" calls `settled()` on the rail before reading its width.

### The design page needs no change

On #178, the design page's `beforeEach` met "Something went wrong". The dev server's log shows `database is locked: SQLITE_BUSY` just before it, and Better Auth then failing to check the session. Back then, the app server and the dev server shared one local database. #181 gave the dev server its own (`.wrangler/e2e-dev-state`), so the cause is gone. With an empty Vite cache, `design-page.spec.ts` passed in two runs here.

Alternative: open `/design` once in a global setup, in case Vite was still preparing modules. Nothing points to that, and it would add a few seconds to every run.

### A flaky test fails the run in CI

`failOnFlakyTests: !!process.env.CI`. `retries` stays at 1 in CI, so a flaky test still leaves its trace. The summary step in `ci.yml` already lists flaky tests.

## Risks / Trade-offs

- [Playwright skips dependent projects when a test in a project they depend on fails] → The tagged tests then don't run. The run has failed already, and they run once it is fixed.
- [A run takes longer, as the tagged tests run one at a time] → 6 tests on 2 devices, a few seconds each.
- [React Router may add a different `_routes` to the Back's `.data` request than to the first visit's, so `answerAtOnce()` wouldn't find it] → Check the addresses when writing the test. If they differ, match on the path without `_routes`.
- [A tagged test can still miss on a slow CI machine running alone] → `failOnFlakyTests` names it. The next step would then be a hook in the app, as a new issue.
