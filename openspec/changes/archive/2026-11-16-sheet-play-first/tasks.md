# Tasks

## 1. Saving on demand

- [x] 1.1 Add `saveNow()` to `Autosave`, answering "saved", "failed" or "stopped", and expose it from `useAutosave`; verify with `autosave` unit tests for nothing waiting, a save in flight, an offline save and a stopped autosave

## 2. The sheet's bar and Back

- [x] 2.1 Add one function for where Back, Done and Delete go, from React Router's history index and whether edit mode came from play; verify with unit tests for a sheet opened from the list, from a link and from "New sheet"
- [x] 2.2 Build `SheetBar` for play (Back, View, Edit, menu) and edit (Done, save state, help, menu), with no account link, and Edit as an icon only on a phone; verify with component tests for both modes
- [x] 2.3 Add one function for the sheet's menu items ("Choose collections…", "Print", "Delete") used by both modes; verify with a unit test
- [x] 2.4 Drop `back` and `afterBack` from `TopBar`, delete `PlayEditSwitch`, and keep the home page and `/editor` as they are; verify with the `top-bar` and `home` tests

## 3. Play view

- [x] 3.1 Use `SheetBar` on `routes/sheet.tsx`, with "View" as a popover holding the text size and the "Lyrics only" switch, and remove the bar's toggle, the icon buttons and the phone's "More"; verify with the `sheet` route tests
- [x] 3.2 Make "Edit" push `/sheets/:id/edit` with the key and capo, marked as coming from play, and apply a key and capo handed back by "Done" on arrival without loading again; verify with route tests of the address it opens and of a hand-off
- [x] 3.3 Show the open version's name in the key button and the artist alone; verify with route tests for a version, a renamed version and a deleted one
- [x] 3.4 Read the sheet's collections in the play loader and show them as links under the title above 640px, reloading once after "Choose collections…" closes with a change; verify with a loader test and a route test
- [x] 3.5 Delete from the menu with the existing confirm dialog, leaving as Back does; verify with route tests for confirm, cancel and a failed delete
- [x] 3.6 Centre the sheet; verify on a wide screen with the browser-check skill

## 4. Edit mode

- [x] 4.1 Use `SheetBar` on `routes/sheet.edit.tsx`, move the save state into the bar, centre the editor, and remove the side panel; verify with the `sheet.edit` route tests
- [x] 4.2 Make "Done" and the browser's back await `saveNow()`, hand over the key and capo, then step back to play, or replace with play when edit mode didn't come from it; verify with route tests that an unsaved edit is sent before the move, for both cases
- [x] 4.3 Guard in-app moves with `useBlocker`: save, then go; on a failed save, ask "Leave without the edits?"; after a conflict or a delete, go at once; verify with route tests for each case
- [x] 4.4 Add "Rename" beside the title, disabled when read-only, and remove "Rename" from the menu; verify with the `sheet.edit` route tests
- [x] 4.5 Add the first-time note with both pointer texts, "All shortcuts" and "Got it", kept in a cookie read by the loader; verify with a loader test and a route test that the note goes after "Got it"
- [x] 4.6 Open the help from "How to edit" in the edge panel at every width; verify with a route test on a wide window
- [x] 4.7 After Delete, leave as Back from play would, stepping back past play when it is below, instead of opening `/sheets`; verify with route tests with and without a play entry below

## 5. Docs and end to end

- [x] 5.1 Update `docs/ui-text.md` (top bar, play view, sheet's menu, saving, the first-time note, the leave prompt) and `docs/design-direction.md` (top bar on a sheet, play first, no side panel on a sheet); verify the wording matches the UI
- [x] 5.2 Update `e2e/play.spec.ts`, `e2e/sheet.spec.ts` and `e2e/library.spec.ts`: Back to a search with its scroll, Back from a link, Edit and Done keeping key and capo, Done saving at once, the browser's back from edit mode to play, the browser's back offline, the menu, and "Got it" across a reload; verify `pnpm e2e` passes for these files
- [x] 5.3 Check play, View, the menu and edit mode on a phone, a middle and a wide screen with the browser-check skill; verify against the canvas boards
