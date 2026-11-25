# Tasks

## 1. Brief states and motion

- [x] 1.1 In `library.spec.ts`, call `settled()` on the rail before reading its width in "lists the collections, and opens one". Verify it passes 5 of 5 on chromium with `--repeat-each 5` while the full suite runs alongside.
- [x] 1.2 In `waiting.spec.ts`, make "keeps the bar away during a slow search" hold `/sheets.data` with `hold()`, check "Searching…" and no bar, then release and expect "1 sheet". Verify it passes with `--repeat-each 8` and 4 workers.

## 2. Tests that need data in time

- [x] 2.1 In `playwright.config.ts`, add `timing-chromium` and `timing-phone` (one worker each, run only `@timing`, chained after `chromium` and `phone`), and `grepInvert: /@timing/` on `chromium` and `phone`. Verify with `--list` that each tagged test is listed only under the timing projects, and in a run that they start after the others.
- [x] 2.2 Tag the six tests in design.md's table `@timing`. Verify `--list --grep @timing` shows the six on each device.
- [x] 2.3 Answer from memory after a first visit in the Back test, the two quick-page tests and the quick-collections test, as design.md describes. Check that the step's `.data` address matches the first visit's. Verify that `fromMemory()` is at least 1 in each, and that the tests pass.

## 3. Flaky tests fail CI

- [x] 3.1 Set `failOnFlakyTests: !!process.env.CI` in `playwright.config.ts`. Verify locally with `CI=1` and a test made to fail once that the run fails and the summary still names it.

## 4. Whole suite

- [x] 4.1 Run `just e2e` 5 times with the default workers. Verify that every run passes with no flaky tests.
- [ ] 4.2 Verify on the PR's CI run that the e2e step passes with no flaky tests in the summary.
