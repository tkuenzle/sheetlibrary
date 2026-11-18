# Tasks

## 1. One way to leave

- [x] 1.1 Add `apps/web/app/ui/exit.ts` with `closeAfterExit(dialog)` and `usePresence(open)` as the design says; verify `pnpm lint` and a unit test that `closeAfterExit` closes at once when there are no animations
- [x] 1.2 Move `shell/edge-panel.tsx` and `editor/panel.ts` onto `closeAfterExit`; verify the rail, help and key panel e2e tests in `library.spec.ts` and `editor.spec.ts` pass unchanged
- [x] 1.3 Keep both chord inputs, floating and docked, through their exit with `usePresence`, and drop the 300ms timer; verify the chord input e2e tests in `sheet-editor.spec.ts` pass unchanged
- [x] 1.4 Update `docs/motion.md`: under "Overlays", the panels under their button move like menus, and how an exit is played (`data-closing`, then close); under "What stays still", tooltips; verify it matches the design

## 2. Menus and panels grow

- [x] 2.1 Keep `ui/menu.tsx`'s list mounted through its exit with `usePresence`, `inert` while closing, focus back on the button at once; verify with a new `e2e/overlay-moves.spec.ts` test that "More for this sheet" runs a grow-in on opening and a faster exit on Escape, and that the menu is gone after it
- [x] 2.2 Add the grow in and out to `menu.css`, with `transform-origin` by placement; verify in the e2e test that the list's origin is its top right for `below-end`
- [x] 2.3 Make the key, capo and View panels grow from their button on wider screens through the same exit; verify with an e2e test in a 1200px window that the key panel's exit runs on Escape and focus is back on the key button
- [x] 2.4 Make the floating chord input grow from its letter and shrink back in `chord-input.css`; verify with an e2e test in a 1200px window with a mouse that it grows from its top left on opening, its exit runs on Cancel, and focus is back in the editor

## 3. Dialogs grow from the centre

- [x] 3.1 Add the grow and the scrim's fade, in and out, to `confirm-dialog.css` and `import-button.css`; verify with `pnpm lint` that only motion tokens and `opacity`, `scale` and `translate` are used
- [x] 3.2 Close `ConfirmDialog`, `NameDialog`, Add sheets, Choose collections and the import dialog through `closeAfterExit`, with Escape stopped at `keydown`, and `onClose` tidying up however it closed; verify with an e2e test that Cancel on the sheet's delete question plays the exit, a second tap during it does nothing, and focus is on the menu's button
- [x] 3.3 Leave a confirm dialog whose action worked, and one its page closes, without an exit; verify with an e2e test that deleting a sheet leaves for `/sheets` with no dialog exit running

## 4. Photo import slides up on a phone

- [x] 4.1 Give `photo-import-dialog.css` the grow on wider screens and a slide from the bottom below 641px, and close it through `closeAfterExit`; verify with an e2e test on a phone that "From photos…" slides it up and Close slides it down

## 5. The "New sheet" ways rise

- [x] 5.1 Give each way in `ui/floating-button.tsx` a `--i` from the button outward, rise and fade them in turn in `floating-button.css`, fade "Close" in with the scrim, and close through `closeAfterExit`; verify with an e2e test on a phone that "From Ultimate Guitar…" starts first and the three leave together

## 6. Checks

- [x] 6.1 Add an e2e test with reduced motion that a menu, a dialog and the "New sheet" ways open and close with their animations taking 0s
- [x] 6.2 Record a trace with `blink.animations` while opening and closing a menu, a dialog and the "New sheet" ways; verify none is listed with `compositeFailed` (besides the browser's `plus-lighter`)
- [x] 6.3 Run `pnpm lint`, `pnpm test` and the full e2e suite; verify they pass
- [x] 6.4 With the browser-check skill, on a phone with the CPU slowed 6×, open and close each overlay; verify each looks as the design's table says

## Workflow follow-up

- Archive the change once the PR is reviewed, then close #160 with the PR.
