# Tasks

## 1. Base parts

- [x] 1.1 Add the `link` icon (Material Symbols Rounded, weight 500, 24px) to `ui/icons/` and `icons.ts`. Verify the icon tests pass.
- [x] 1.2 Give `Menu` a `filled` variant, a square icon form and a `beside` placement, and move its arrow-key handling into a helper. Cover them in `menu.test.tsx` and verify it passes.
- [x] 1.3 Add `FloatingButton` (64px square, above the bar, phone width only) and `FloatingMenu` (modal `<dialog>` with the ways stacked above a "Close" in the button's spot, closing on Escape, "Close" and the backdrop, with focus back on the button) to `ui/`. Cover what they render in unit tests, and show both on `/design`. Verify `e2e/design-page.spec.ts` passes, with the forced-colors outline on both.

## 2. The three ways in the shell

- [x] 2.1 Add `sheets/new-sheet.tsx` with the provider, `useNewSheet()` and `start(way)`: "write" submits a post to `/sheets`; "photos" and "ultimate-guitar" open the dialogs moved from `LibraryImport`, which return focus to the opener on close. Wrap `ShellView`'s content in it. Cover it in a unit test and verify it passes.
- [x] 2.2 Put "New sheet" under the site's name in the full rail (wide and opened) and as the square button under "Open navigation" in the compact rail, through a new slot in `NavRail`. A way picked in the opened rail slides the rail out first. Update `nav-rail.test.tsx` and `shell.test.tsx` and verify they pass.
- [x] 2.3 Add e2e cases for "New sheet on another screen", "On a tablet" and "A way picked from the opened rail", and update the Shell line in `docs/ui-text.md`. Verify the cases pass.

## 3. Sheets

- [x] 3.1 Remove `LibraryImport`, `NewSheet`, `Actions` and the docked CSS from `routes/sheets.tsx` and `sheets.css`. Render the `FloatingMenu` "New sheet" on phones. Update `sheets.test.tsx` and verify it passes.
- [x] 3.2 Replace "No sheets yet" with "Add your first sheet", its line, and the three cards: "Write it" as a `<Form method="post" action="/sheets">`, the other two calling `start`. Three across when wide, stacked on a phone. Update `sheets.test.tsx` and verify it passes.
- [x] 3.3 Update `e2e/library.spec.ts` and `e2e/photo-import-dialog.spec.ts` to go through "New sheet" and its ways (scenarios "Starting a sheet", "Naming a new sheet", "First sign-in", "Writing the first sheet", "Importing a song", "Cancelling", "Importing photos", "On a phone", "Opening the menu on a phone", "A new sheet" focus). Add a case that "Write it" works with JavaScript off. Verify they pass.
- [x] 3.4 Update the Sheets, Import and Import from photos lines in `docs/ui-text.md` with the menu, the cards and their lines. Verify no line still names the "Import" menu.

## 4. Collections and a collection

- [x] 4.1 Make the docked "New collection" on Collections and "Add sheets" on a collection a `FloatingButton`, kept out of the empty states. Keep the buttons beside the heading wider than a phone. Update `collections.test.tsx` and `collection.test.tsx` and verify they pass.
- [x] 4.2 Add e2e cases for "On Collections" and "On a collection" on a phone, and for "Opening Collections" and "Opening Sheets" at 1280px, in `collections.spec.ts` and `library.spec.ts`. Update the Collections and A collection lines in `docs/ui-text.md`. Verify the cases pass.
- [x] 4.3 Update `docs/design-direction.md`: "New sheet" in the rail, and the screen's add button on a phone. Verify it names both.

## 5. Check

- [x] 5.1 Check in a real browser with the browser-check skill, at 1280px, 800px and 390px: the rail against "Sheets, desktop", the compact and opened rail against "Sheets, middle" and "The rail, opened", the phone's menu against "New sheet: one button, three ways", the empty library against "Empty library (first sign-in)", and a list scrolled to its end under the floating button. Both styles, and 200% text. Verify that `just check` passes.

## 6. "New sheet" floats on every screen

- [x] 6.1 Move the floating "New sheet" from `routes/sheets.tsx` into `ShellView`, hidden on the empty library by `.shell:has(.library-first)`. Update `shell.test.tsx` and `sheets.test.tsx` and verify they pass.
- [x] 6.2 Remove the floating "New collection" and "Add sheets", and show the tonal buttons beside the heading on phones. Update `collections.test.tsx` and `collection.test.tsx` and verify they pass.
- [x] 6.3 Update the e2e cases for "On Collections", "On a collection on a phone" and "Empty library on a phone", and the Sheets, Collections and A collection lines in `docs/ui-text.md` and `docs/design-direction.md`. Check the headings at 390px in a browser, and verify that `just check` passes.

## Workflow follow-up

- Archive the change in the PR that closes #133, before it merges.
