# Tasks

## 1. Autosave

- [x] 1.1 Add the save state `deleted`: a save answered with 404 sets it and stops, as a 409 sets `conflict`. Verify with `autosave.test.ts`: after a 404 no further save goes out, even after another edit
- [x] 1.2 Replace `dispose()` with `stop()`: it clears the timer, and a save that answers afterwards changes no state and schedules nothing. Return it from `useAutosave`, which also calls it on unmount. Verify with `autosave.test.ts` for a stop while waiting and a stop while a save is under way that then fails

## 2. Deleted elsewhere

- [x] 2.1 Show "Not saved" for `deleted`, make the editor, title, artist and "Rename" read-only as for `conflict`, and show `DeletedNote` ("This sheet was deleted." with a link to `/sheets`). Verify with a render test for the scenario "Deleted in another tab"
- [x] 2.2 Add the note's words to `docs/ui-text.md`

## 3. Confirm dialog

- [x] 3.1 Add the `delete` icon to `icons.ts`. Verify with `icon.test.tsx`
- [x] 3.2 Add `ConfirmDialog` to `ui/`, as on the canvas board "Delete, from the sheet": a modal `<dialog>` with `role="alertdialog"`, focus on "Cancel", Escape cancels, a scrim click does nothing, buttons disabled while `onConfirm` runs, and a note when it fails. Verify with unit tests for each of these

## 4. Delete on the sheet page

- [x] 4.1 Add "Delete" below "Rename" in the sheet's menu, disabled on `deleted` only. It opens the dialog with "Delete “<title>”?" and "The sheet is gone for good. This can’t be undone.". Verify with render tests that it is enabled after a conflict and disabled after `deleted`
- [x] 4.2 On confirm, send `DELETE /api/sheets/:id`, and on 204 or 404 stop autosave and navigate to `/sheets`; otherwise show "The sheet couldn’t be deleted. Try again." in the dialog. Verify with tests for the scenarios "Deleting", "Cancelling" and "Offline", and one for a 404
- [x] 4.3 Add "Delete", the dialog and its failure note to `docs/ui-text.md`, and update the sheet's menu entry there

## 5. Checks

- [x] 5.1 Add e2e tests to `sheet.spec.ts`: delete a sheet, land in the library without it (scenario "Deleting"), delete in one tab, then edit in a second (scenario "Deleted in another tab"), and check the dialog's focus on Cancel, Escape and a scrim click
- [x] 5.2 Look at the menu and the dialog on a phone and a wide window with the browser-check skill
- [x] 5.3 Run `just check` and `just spec-check`. Verify both pass

## Workflow follow-up

- Close #77 with the pull request. Archive the change after review.
