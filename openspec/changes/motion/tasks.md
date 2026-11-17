# Tasks

## 1. The concept and the tokens

- [x] 1.1 Write `docs/motion.md`: where things sit (peers fade, a sheet rises, Edit is a mode, the shell stays), calm curves with faster exits, the tokens and what each is for, overlays, what stays still, and reduced motion; add a short "Motion" section to `docs/design-direction.md` that points to it; verify every case in the proposal's concept is in the doc
- [x] 1.2 Add `--motion-short`, `--motion-medium`, `--motion-long`, `--ease-enter`, `--ease-exit` and `--ease-move` to `ui/tokens.css`, with the durations at `0s` under reduced motion; verify with `pnpm lint` and the `/design` page in both styles

## 2. What moves today, on the tokens

- [x] 2.1 Move `EdgePanel` and the key panel onto the tokens and remove their reduced-motion blocks; verify the rail and help slide as before, and add an e2e case that opens and closes the key panel on a phone at once with reduced motion
- [x] 2.2 Move the docked chord input onto the tokens, remove its reduced-motion block and the `matchMedia` check in `sheet-editor.tsx`; verify "opens and closes the docked chord input at once with reduced motion" in `e2e/sheet-editor.spec.ts` still passes
- [x] 2.3 In `packages/chord-editor/src/style.css`, use `var(--chord-editor-motion, 150ms)` for the lift and the docked toolbar, list the property in the stylesheet's header, and set it to `--motion-short` in the app; verify "lifts the label at once with reduced motion" and the package's tests pass
- [x] 2.4 Move the dimming of old search results (`sheet-list.css`, `routes/sheets.css`, `add-sheets-dialog.css`) onto `--motion-short`; verify with the `library` e2e tests
- [x] 2.5 Make the Lyrics only switch's handle move with `translate` and `scale` on the tokens, and remove its reduced-motion block; verify the handle looks as before in both states, and add an e2e case in `e2e/design-system.spec.ts` that it is at its end at once with reduced motion
- [x] 2.6 Check the loading bar and the photo import's sign still stand still with reduced motion; verify with the existing `waiting` and photo import tests

## 3. The active section

- [x] 3.1 Fade the active section's background, label and chord colors in `editor/sheet-editor.css` at `--motion-short` with `--ease-move`; verify with an e2e case that the second section's background changes over time after a click, and one that it changes at once with reduced motion

## 4. Checks

- [x] 4.1 Search the app and the package for durations and curves outside the tokens, and for `prefers-reduced-motion` outside `tokens.css`, the two loops and the package; verify none is left
- [x] 4.2 Check the panels, the key panel, the chord input, the switch and the active section on a phone and a wide screen, with and without reduced motion, with the browser-check skill; verify the durations are as before and only the curves, the switch and the active section differ
