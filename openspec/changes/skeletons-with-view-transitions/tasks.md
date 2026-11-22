# Tasks

## 1. Spike

- [x] 1.1 In the scratchpad, make the collection's loader wait up to 150ms and return its data whole; in Chromium, verify that with data held back 50ms the page fades in with its rows and no bars, with a move and with reduced motion; record the result in design.md
- [x] 1.2 In the same spike, hold the data back 200ms and measure how long the bars show, with a move and with reduced motion; verify at least 250ms, and that a value set on a React Router context in the client middleware reaches the client loader; adjust design.md if either fails

## 2. Head start

- [x] 2.1 Add `HEAD_START = 150` to `shell/slow-wait.ts`; verify with a unit test that it is below `SLOW_WAIT`
- [x] 2.2 Add the helper to `shell/awaited.tsx` that races the data against a wait; verify with unit tests: data in time comes whole, late data comes as a promise, a wait of 0 hands over the promise at once, and a failure within the wait throws
- [x] 2.3 Make the root's client middleware put "the browser moved" on a React Router context before `next()`; verify with a test in `page-moves.test.ts` for a step back with and without the browser's own move

## 3. Another page

- [x] 3.1 Make `fromAnotherPage()` compare with the page on screen (`shown`) instead of `window.location`, and the sheet's "from its own edit mode" check too; verify with unit tests for a push, a step back, a search on the same page, and play after edit
- [x] 3.2 Add an e2e test for "Back to a slow list": with the list held back 2s, Back from a sheet drops onto the list's page with bars, and the rows follow

## 4. Loaders and skeletons

- [x] 4.1 Switch the client loaders in `routes/sheets.tsx`, `routes/collection.tsx`, `routes/sheet.tsx` and `routes/account.tsx` to the helper, with a wait of 0 when the browser moved; verify the existing loading, waiting and page-move e2e tests pass
- [x] 4.2 Make the helper hold late data until `SKELETON_HOLD` after the handover, a failure at once (design: "Hold the bars in the helper"); verify with unit tests
- [x] 4.3 Remove `holdBars`, `PageSkeleton`, `barsShownAt`, `dataArrived` and `movePlays()`, and the `holdBars` unit tests; verify `pnpm lint` and the type check pass, and that the dialogs' bars still work in their e2e tests
- [x] 4.4 Add an e2e test for "A quick collection": data held back 50ms, the page fades in with its rows and no bars; verify "shows no bars for a quick page without a move" still passes
- [x] 4.5 Add an e2e test for "Data just after the wait" (data held back 200ms, bars stay at least 400ms, checked as 390ms), with a move and with reduced motion; verify all pass
- [x] 4.6 Update the comments that describe the old timing in the loaders and `awaited.tsx`; verify none mention `holdBars`, `movePlays` or the 400ms hold for pages

## 5. Docs

- [x] 5.1 Update `docs/motion.md`: "A page moves in with its skeleton", "Bars never flash" and "Rows show once the page is in" describe the 150ms wait, bars at once, the hold, and React showing the rows after the move; verify it names no removed function

## 6. Check

- [x] 6.1 Run the whole e2e suite, `pnpm lint` and the unit tests; verify all pass
- [x] 6.2 Check in the browser with the `browser-check` skill: opening a collection and a sheet, and Back, on a fast and a throttled connection; verify no bars blink

## Workflow follow-up

- Ask in the PR for the Safari check on an iPhone: swiping back to a slow list.
- Update #168's text to this scope, and open issues for rows fading in, measuring page data, and cutting its latency.
- Archive the change after review.
