# Tasks

## 1. Spike

- [x] 1.1 In the scratchpad, give a sheet row and Back `viewTransition` and set `data-move` on `<html>` in a layout effect; in Chromium, verify that a rule on `html[data-move=rise]::view-transition-new(root)` applies to the move (its animation shows in `document.getAnimations()`), and that `/sheets` keeps its scroll in the new picture on Back
- [ ] 1.2 Ask the person to swipe back on an iPhone on a preview with a `popstate` logger; record in design.md whether Safari reports `hasUAVisualTransition`, and adjust the "browser's own move" decision if it doesn't

## 2. Kinds of move

- [x] 2.1 Add `shell/page-moves.ts` with a function that gives the kind of move (`fade`, `rise`, `drop`, `mode` or none) from the last and the new page; verify with unit tests for each pair, including a sheet to a collection and play to edit of another sheet
- [x] 2.2 Keep the last page's kind in the root and set `data-move` on `<html>` in a layout effect when the page changes; verify with the e2e tests in 3 to 5 that the attribute follows each move (the unit tests have no DOM)
- [x] 2.3 Add `shell/page-moves.css` (layer `components`) with the four moves on `::view-transition-old(root)` and `::view-transition-new(root)`, using only the motion tokens; verify `pnpm lint` and that no number of milliseconds or curve is written in it
- [x] 2.4 Add a "Page changes" section to `docs/motion.md`: View Transitions through React Router, the four kinds, the shared title name and why the rail has no name; verify it matches the design

## 3. The shell's screens fade

- [x] 3.1 Add `viewTransition` to the links in `ui/nav-rail.tsx`, `ui/nav-bar.tsx` and the collection links in `routes/collections.tsx`; add an e2e test that moves from Sheets to Collections to a collection and checks that a move with `data-move=fade` ran each time, and that typing a search runs none
- [x] 3.2 Add an e2e test with reduced motion that the fade's animations take 0s

## 4. A sheet rises and drops

- [x] 4.1 Add `viewTransition` to the rows in `sheets/sheet-list.tsx` and `sheets/recent-sheets.tsx`, each link putting its list in the location's state; verify with an e2e test that opening a sheet from a row runs a move with `data-move=rise`
- [x] 4.2 Give the row's title and the sheet's heading `view-transition-name: sheet-title` while their sheet is in the move, only for the row in the list from the state; verify with an e2e test on `/sheets` with recent sheets showing that exactly one element has the name in each picture and the move isn't skipped
- [x] 4.3 Make `useSheetMoves().go()` pass `viewTransition` when it opens an address; verify with e2e tests that Back by the arrow and by the browser run `data-move=drop`, that Back from a sheet opened from a link drops into `/sheets`, and that the list keeps its scroll

## 5. Edit is a mode

- [x] 5.1 Add `viewTransition` to "Edit" in `shell/sheet-bar.tsx`, and make sure Done and edit mode's held move in `routes/sheet.edit.tsx` go through a path that asks for one; verify with e2e tests that Edit, Done right after a change, and the browser's back in edit mode run `data-move=mode`

## 6. The browser's own move

- [x] 6.1 Following the spike, listen to `popstate` in the root and set `data-move="none"` when the browser showed its own move, with no animation for `none` in `page-moves.css`; verify with a unit test that a `popstate` with `hasUAVisualTransition` gives `none`

## 7. Checks

- [x] 7.1 Run `pnpm lint`, `pnpm test` and the full e2e suite; verify they pass (on an empty local database, as in CI)
- [x] 7.2 With the browser-check skill, on a phone with the CPU slowed down 6×, go through each move and back; verify each looks as the design's table says, the rail stays still, and the title lands on the heading (play and edit don't line up; see #161)
- [ ] 7.3 Ask the person to try the moves on an iPhone on the preview, swiping back included; verify the sheet doesn't drop after the swipe

## Workflow follow-up

- Archive the change once the PR is reviewed, then close #136 with the PR.
