# Tasks

## 1. Choose the curve

- [x] 1.1 Add a "Motion" page to the "Sheet Library UI" design canvas with the variants from design.md ("The curve for large surfaces is chosen by eye"), on a phone-sized frame, each with a replay button and labelled with its curve and duration. Verify that every variant replays and that the user has seen the page.
- [x] 1.2 Iterate on the page with the user until they pick a curve for photo import and one for the sheet's rise. Record the picks in design.md. Verify that design.md names both picks.

## 2. Photo import on a phone

- [x] 2.1 Make photo import on a phone slide up over `--motion-long` and down over `--motion-medium` on the picked curves, with its scrim fading over the same times (`photos/photo-import-dialog.css`). If emphasized won, add `--ease-enter-emphasized` and `--ease-exit-emphasized` to `ui/tokens.css`. Verify with the "photo import slides up on a phone" case in `e2e/overlay-moves.spec.ts`: 300ms in and 200ms out.
- [x] 2.2 Add an e2e case for the scenario "A large sheet takes longer": on a phone, photo import slides up for longer than the key panel. Verify that it passes in the phone project.

## 3. The sheet's rise

- [x] 3.1 If the rise's curve changed, give `::view-transition-new(.rise)` the picked curve and the drop its pair (`shell/page-moves.css`). Verify with `e2e/page-moves.spec.ts` and the browser-check skill on a phone-sized window.

## 4. Linear fades

- [x] 4.1 Give `--ease-linear` to the fades of opacity alone: the scrims in `ui/confirm-dialog.css`, `photos/photo-import-dialog.css` and `editor/import-button.css`, the scrim and "Close" in `ui/floating-button.css`, `edge-panel-fade` in `shell/edge-panel.css`, and `key-panel-fade` in `editor/key-button.css`, coming in and leaving. Verify with `e2e/overlay-moves.spec.ts`, and that a search for `--ease-enter` and `--ease-exit` finds no animation of opacity alone.

## 5. Documentation

- [x] 5.1 Add a "Material 3" section to `docs/motion.md`: the order (our constraints, then Material 3's reasoning, then its numbers), why page moves stay at 300ms or less, and each difference with its reason (crossfade, no springs, 0.95, the rising ways). Note that Material 3's doc and code disagree. Update the token table's roles, the "Calm" section and the overlays' durations. Verify that every rule in the section matches the CSS.
- [x] 5.2 Update the motion paragraph in `docs/design-direction.md` and the motion comment in `ui/tokens.css` to match. Verify that both point to the new section.

## 6. Check

- [x] 6.1 Run `pnpm typecheck` and `pnpm lint` at the root, and `pnpm test` and `pnpm e2e` in `apps/web`. With the browser-check skill on a phone-sized window, open and close photo import, the key panel, a dialog and the opened rail, and open and leave a sheet. Check that reduced motion still makes all of them instant.
