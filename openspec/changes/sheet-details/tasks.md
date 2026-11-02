# Tasks

## 1. Saving the details

- [x] 1.1 Add `TITLE_MAX` and `ARTIST_MAX` (100) to the `chordsheet` package and report longer text in `checkEnvelope`. Verify with `sheet-envelope.test.ts` for the scenario "Title too long" and an artist of 101 characters
- [x] 1.2 Let Autosave's `read` return `{ title, artist, content }` and send those, keeping only the id from the loaded sheet. Leave `artist` out when there is none. Verify with `autosave.test.ts`: a changed title goes out with the next save, and a removed artist is left out

## 2. Fields and menu

- [x] 2.1 Add a field for the title and artist that keeps on Enter or blur, cancels on Escape, keeps only once, trims, takes up to 100 characters and selects its text when it opens. Verify with unit tests for each key, and for "Untitled" and a removed artist on empty text
- [x] 2.2 Make the heading a button inside the `<h1>` that opens the title field, and show the artist or "Add artist" below it, as on the canvas board "New sheet: opens as Untitled". Verify with render tests for a sheet with an artist and one without
- [x] 2.3 Add `Menu` to `ui/`, with the icons `more_vert` and `edit`: aria attributes, the first item focused on open, arrow keys, and close on Escape or a click outside with focus back on the button. Verify with unit tests for opening, the keys and closing
- [x] 2.4 Put the sheet's menu at the end of the title's line with "Rename", which opens the title field. Verify with a test for the scenario "Rename from the menu"

## 3. Sheet page

- [x] 3.1 Keep the title and artist in `SheetView`'s state, pass them to Autosave, call `edited()` when a kept value changed, and set `document.title` from the title. Verify with tests for the scenarios "Renaming" and "Clearing the title"
- [x] 3.2 Make the title, the artist and "Rename" read-only after a conflict, and close an open field without keeping. Verify with a test for the scenario "Renaming after a conflict"
- [x] 3.3 Redirect "New sheet" to `/sheets/:id?new`; on `new`, open the title field with "Untitled" selected and drop the parameter from the URL. Verify with the action test and a test that a load without `new` keeps the field closed
- [x] 3.4 Add the rename line to the help on the sheet page only. Verify with render tests for `/sheets/:id` and `/editor` (scenario "Help on the sheet page")
- [x] 3.5 Add the words for the title field, "Add artist", the menu and the help line to `docs/ui-text.md`

## 4. Checks

- [x] 4.1 Add e2e tests to `sheet.spec.ts`: rename, add an artist, wait for "Saved", reload and see both, then see them in the library (scenarios "Reload after renaming" and "Adding an artist"). Add one for "Undo after renaming"
- [x] 4.2 Extend the e2e test in `library.spec.ts`: "New sheet", type a title, press Enter and see it as the heading (scenario "Naming a new sheet")
- [x] 4.3 Look at the heading, the fields and the menu on a phone and a wide window with the browser-check skill
- [ ] 4.4 Check production for titles or artists over 100 characters before merging
- [x] 4.5 Run `just check` and `just spec-check`. Verify both pass

## Workflow follow-up

- Close #76 with the pull request. Archive the change after review.
