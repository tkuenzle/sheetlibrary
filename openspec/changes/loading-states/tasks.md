# Tasks

## 1. Spike

- [x] 1.1 In the scratchpad, make the collection page's `clientLoader` return the server loader's promise unawaited, with the rows in `<Suspense>`/`<Await>`; in Chromium with its data held back 2s, verify the fade starts at the tap with the skeleton in the new picture, and record the result in design.md
- [x] 1.2 In the same spike, hold the data back 50ms and verify no row shows before the fade ends; delete a row and verify the other rows stay while the list loads again; adjust design.md if either fails

## 2. Skeleton bars

- [x] 2.1 Add `ui/skeleton.tsx` and its CSS (layer `components`): a bar in `--quiet` or the soft accent, pulsing on `opacity` only, standing still with reduced motion; verify with a unit test of its variants and `pnpm lint`
- [x] 2.2 Show the bars on the design page; verify it renders in the dev server
- [x] 2.3 Add skeletons to `docs/motion.md`: how they fit with moves ("A late page cuts" and "Page changes"), the pulse under "Reduced motion"; verify it matches the design

## 3. A collection

- [x] 3.1 Hand over the rows as a promise in `routes/collection.tsx`, render them in `<Await>` with a `<Suspense>` keyed by the collection's id, the name and count from the shell's data, and `meta()` from the shell's match; verify with a unit test that the skeleton has `min(count, 8)` rows
- [x] 3.2 Throw a rejected promise on to the route's `ErrorBoundary`, follow a redirect, and show "not found" for a 404; verify with the existing e2e test "shows the note inside the shell offline" and a test for a collection that is gone
- [x] 3.3 Add e2e tests: with the data held back 2s, the page fades in with "Christmas", its count and bars, then shows the rows; with 250ms, the bars stay until the move ends (dropped: the rows show as they arrive); from one collection to another, the old rows never show under the new name

## 4. Sheets

- [x] 4.1 Hand over the list and Recent as a promise in `routes/sheets.tsx`, keeping the "keep the last results" rule inside it; render the Recent cards and the list rows as bars while it loads; verify the existing search and offline e2e tests pass
- [x] 4.2 Add e2e tests: with the data held back, Sheets fades in with bars; deleting from a row keeps the other rows on screen while the list loads again

## 5. A sheet

- [x] 5.1 Make `openedFrom()` carry the row's title and artist, and show them in the sheet's heading from the location's state, with a bar when there is none; verify with a unit test of `openedFrom()`
- [x] 5.2 Hand over the sheet as a promise in `routes/sheet.tsx`, with bars for the chips and the lines; verify that the 404 page and the redirect for a version that is gone still work in their e2e tests
- [x] 5.3 Change the e2e test where a sheet held back 600ms shows without rising: it now rises with its title and bars; add a test that the title still moves from the row to the heading

## 6. Account

- [x] 6.1 Hand over the passkeys as a promise in `routes/account.tsx`, with a bar for the email and bar rows for the passkeys; verify with an e2e test with the data held back

## 7. Dialogs

- [x] 7.1 Show bar rows in "Add sheets" while its fetcher has no data yet; verify with a component test, and that "Add 0 sheets" stays disabled
- [x] 7.2 Show bar rows in "Choose collections" in place of "Loading collections…", with "New collection" disabled and "Done" working; verify with a component test

## 8. A long wait

- [x] 8.1 Move the e2e test for "No move after a long wait" to Edit, held back 600ms; verify it shows without a move

## 9. Checks

- [x] 9.1 Run `pnpm lint`, `pnpm test` and the full e2e suite; verify they pass
- [x] 9.2 With the browser-check skill, on a phone with the CPU slowed 6× and a slow network, open each page and dialog; verify the skeleton matches the "Loading" boards, nothing shifts when the data arrives, and the bars stand still with reduced motion
- [ ] 9.3 Ask the person to try the moves on an iPhone on the preview, on a fast connection; note whether rows that arrive during the move look like a flicker

## Workflow follow-up

- Archive the change once the PR is reviewed, then close #137 with the PR.
