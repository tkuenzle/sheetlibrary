# Tasks

## 1. Stack

- [ ] 1.1 Move `react-router` and `@react-router/dev` to 8.5.2; verify `just typecheck`, `just lint` and `just test` pass

## 2. Moves through React

- [ ] 2.1 Add a pure function in `shell/page-moves.ts` that picks the move from the page shown, the target address, whether it is a step back, whether the browser moved, and whether the data came late; verify with unit tests: `none` for the same path, after the browser's move and when late, otherwise `moveKind()` of the two pages
- [ ] 2.2 Add the root `clientMiddleware` and the layout effect that keeps the page shown: skip fetchers and revalidations, wait one task on a step back unless the browser moved (capture `popstate` listener), and after `next()` add the kind as a transition type in a pending async action; verify with a unit test that it waits only on a step back without the browser's move
- [ ] 2.3 Wrap the `<Outlet>` in `root.tsx` in `<ViewTransition default="none" update={…}>` and a `<div>` with the page background and `min-height: 100dvh`; port `page-moves.css` to the `.fade`, `.rise`, `.drop` and `.mode` classes, with `:root { view-transition-name: none }` and no animation on the page's group; remove `<PageMoves />` and `data-move`; verify in the dev server that each kind plays
- [ ] 2.4 Remove the `viewTransition` prop and option everywhere, and `UNSAFE_ViewTransitionContext`; verify with `grep` that none is left, and that `just lint` passes
- [ ] 2.5 Make `movePlays()` read `document.activeViewTransition.types`; verify `e2e/loading.spec.ts` and `e2e/waiting.spec.ts` pass, with and without reduced motion
- [ ] 2.6 Rewrite the recorder in `e2e/page-moves.spec.ts` to read each move's types, and keep its tests passing; add tests: the Back arrow, the browser's Back and Forward, and Done move; "Write a new sheet" rises; opening "Add sheets" on a collection doesn't move
- [ ] 2.7 Rewrite "Page changes" in `docs/motion.md`: React's `<ViewTransition>`, the kinds as types, every page change moves, the wait on a step back, and the browser's own move; verify it matches the code

## 3. The title

- [ ] 3.1 Put the row's title, the Recent card's title and the sheet's heading in a named `<ViewTransition>` (`title-list-<id>`, `title-recent-<id>`, the heading from `openedFrom`); replace `sheetTitleName()` and its unit tests; verify in e2e with a sheet in both Recent and the list that the title moves both ways and React logs no error
- [ ] 3.2 In `onShare`, swap the browser's group keyframes for `translate` and `scale` from `titleMoveStart()`, with `--motion-long` and `--ease-move`; give the title's pictures the token durations; verify with an e2e test that the title's group animates neither `width` nor `height`, and takes 0s with reduced motion
- [ ] 3.3 Record a `blink.animations` trace of a rise, a drop and a fade in the production build; verify only `-ua-mix-blend-mode-plus-lighter` reports `compositeFailed`, and note the result in the PR
- [ ] 3.4 Update the title's paragraph in `docs/motion.md`; verify it matches the code

## 4. Data during a move

- [ ] 4.1 Add an e2e test: with the sheet held back about 150ms, the sheet rises with bars, and its lines show only after the move has ended; change any loading test that expects rows mid-move
- [ ] 4.2 Update "Rows show as they arrive" in `docs/motion.md`; verify it matches the new test

## 5. Integration

- [ ] 5.1 Run `just check`; verify it passes
- [ ] 5.2 In the production build (`pnpm --filter web preview`), measure the time from a tap to the move's start for a row, the Back arrow and the browser's Back, before and after this change; note the numbers in the PR
- [ ] 5.3 Ask for a check of Safari's swipe back on an iPhone in the PR preview: the list shows after the swipe without a second move
