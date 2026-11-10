# Tasks

## 1. Editor moves to /sheets/:id/edit

- [x] 1.1 Move `routes/sheet.tsx` with its CSS and tests to `routes/sheet.edit.tsx` (`git mv`), and map `sheets/:id/edit` to it in `routes.ts`. Verify `pnpm typecheck` and the moved unit tests pass.
- [x] 1.2 Make "New sheet" (`routes/sheets.tsx`) and `importedSheetPath` (`sheets/import.ts`) open `/sheets/:id/edit`, keeping `?new` and `?capo`. Update their unit tests. Verify they pass.
- [x] 1.3 Move the e2e tests that edit a stored sheet (`e2e/sheet.spec.ts`, `e2e/library.spec.ts`) to `/sheets/:id/edit`. Verify they pass.

## 2. Sheet moved to a key

- [x] 2.1 Add `transposeSheet(sheet, from, to)` to `packages/chordsheet` and use it in `soundingSheet`. Verify with unit tests for a move with a bass note and for the same key spelled another way, and that the `soundingSheet` tests still pass.
- [x] 2.2 Let `SheetView` take a font size, as `--sheet-view-font-size`. Verify with a `sheet-view.test.tsx` case that renders the size in the HTML.

## 3. Play view

- [x] 3.1 Add `routes/sheet.tsx` for `sheets/:id`: the loader with the redirect, 404 and `noindex` of the editor's, and the page with the heading, the artist and `SheetView` at a size larger than the editor's. Point library rows at it. Verify with `sheet.test.tsx` cases for the heading, the tab title, the 404, and no editor in the HTML.
- [x] 3.2 Render the sheet in the address's key and capo with `useSheetKey` and `transposeSheet`, with the key button in a new `viewOnly` mode and the capo button. Verify with unit tests that `?key=A&capo=2` renders the shapes in the server HTML, and that `viewOnly` has no "Change" and no "Make … the song key".
- [x] 3.3 Add `e2e/play.spec.ts`: a row in the library opens the play view, a pick in the key or capo panel changes the chords with no page load and no request, the address follows, and a reload keeps the key. Verify the test passes.
- [x] 3.4 Add `docs/ui-text.md` entries for the play view and its key panel. Verify the words match the page.

## 4. Play and Edit switch

- [x] 4.1 Add the switch to `TopBar` on both sheet pages: two links after "Library", the current one marked, each carrying the current `?key` and `?capo`, and only icons with names on a phone. Verify with unit tests for both pages, and an e2e test that moves from the play view in A with capo 2 to the editor and back.
- [x] 4.2 Update the top bar entry in `docs/ui-text.md` for the switch. Verify the names match the page.

## 5. Text size

- [x] 5.1 Add the text size step from −2 to +3, kept in a `play-text-size` cookie as `auth/passkey-offer.ts` keeps its cookie, read by the loader, with the scales and bases from design.md. Verify with unit tests for reading the cookie, a missing or wrong value, and the step limits.
- [x] 5.2 Add "Smaller text" and "Larger text", disabled at the ends. Verify with an e2e test that "Larger text" twice gives a larger sheet, and that another sheet's play view opens at that size after a reload, with no layout shift on load.

## 6. Print and the phone

- [x] 6.1 Add "Print", which opens the browser's print, and an `@media print` block that hides the top bar and the buttons. Verify with an e2e test in print mode, in A, that the title, the artist and the chords in A show and no buttons do, and that the page prints to an A4 PDF.
- [x] 6.2 On a phone, move the text size and "Print" into a menu after the key and capo buttons, and the title out of the top bar. Verify with an e2e test at 390px that "Print" in the menu calls the print, and that the page doesn't scroll sideways.
- [x] 6.3 Add the text size, "Print" and the phone's menu to `docs/ui-text.md`. Verify the words match the page.

## 7. In a browser

- [x] 7.1 With the `browser-check` skill, go library → play → transpose → Edit → Play at desktop and phone width, in light and lamplight, and print to PDF. Verify against the design canvas, and that nothing moves after load.
- [x] 7.2 Run `pnpm test`, `pnpm typecheck`, the linter and the e2e suite. Verify all pass.

## Workflow follow-up

- Open issues for keeping the screen awake, and for the proposal's open questions the user wants to keep, after asking the user.
