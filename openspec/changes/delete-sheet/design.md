# Design

## Context

`DELETE /api/sheets/:id` already deletes the owner's sheet and answers 204, or 404 for a sheet that isn't there. A save to a missing sheet answers 404 too, since `saveSheet` only updates and never creates. `Autosave` stops for good only on a 409; every other failure, 404 included, is retried with backoff. `dispose()` clears the timer but doesn't stop a save that is already under way, so its answer can still schedule a retry.

The sheet's menu is the `Menu` from `sheet-details`, holding only "Rename". The app's one dialog is the Ultimate Guitar import: a native `<dialog>` opened with `showModal()`.

The board is "Delete, from the sheet" on the canvas's "Library and account" page: <https://claude.ai/artifact/DcmNjZGDmLtgu7mwb8jyi5>. It shows a centered card over a scrim, the title as the dialog's heading, the text below it, and "Cancel" as a text button beside a filled "Delete" in the accent color.

## Goals / Non-Goals

**Goals:**
- A failed delete leaves the person on the sheet, with the dialog still open.
- A save that answers after the delete changes nothing on the page.

**Non-Goals:**
- Moving the import onto the new dialog.
- Telling a deleted sheet apart from one that never existed. Both answer 404.

## Decisions

**The page deletes through the API, then navigates.** Confirming calls `DELETE /api/sheets/:id` from the browser. On 204 or 404 the page navigates to `/sheets`, whose loader then lists the sheets without this one. Any other answer, or no answer, keeps the dialog open with the note. A route action on `/sheets/:id` that redirects was the alternative. It matches "New sheet", but when the action can't be reached React Router shows the route's error boundary, so the sheet and the dialog would be gone.

**Autosave stops once the delete went through.** `Autosave` gets `stop()`: it clears the timer and marks the loop as stopped, so a save that answers later changes nothing and schedules nothing. The page calls it when the delete succeeds, just before it navigates, and `useAutosave` calls it in place of `dispose()` when the page closes, so leaving mid-save no longer leaves a retry loop behind. Stopping before the delete was the first plan, but a failed delete would then leave the sheet open with saving stopped. The dialog is modal, so no new edit comes in while the delete runs. A save that was already scheduled can still reach the server, before the delete or after it. After it, the save finds no row and changes nothing, so the sheet can't come back.

**A deleted sheet is a final save state.** `SaveState` gets `deleted`. A save answered with 404 sets it and stops, as a 409 sets `conflict`. The save state shows "Not saved" for both. The page's read-only flag covers both states. On `deleted` it also disables "Delete" and shows `DeletedNote` in place of `ConflictNote`: "This sheet was deleted." with a link to the library.

**A confirm dialog in `ui/`.** `ConfirmDialog` takes a title, text, the label of the confirm button and an async `onConfirm`. It is a native `<dialog>` opened with `showModal()`, with `role="alertdialog"` and its heading and text as its name and description. Focus starts on "Cancel", so an Enter pressed out of habit doesn't delete. Escape cancels, as with the import; a click on the scrim does nothing, since this dialog asks a question. While `onConfirm` runs, both buttons are disabled. If it fails, the dialog shows a `Note` under the text and the buttons work again. If it succeeds, the dialog stays open with its buttons disabled until the library replaces the page. Closing it right away showed the sheet page again for a moment while the library loaded. The import stays as it is.

**The `delete` icon.** It joins `icons.ts` from Material Symbols Rounded, weight 500, like the others.

## Risks / Trade-offs

- [Deleting from a tab that is behind removes edits saved from another tab.] → The dialog says the sheet is gone for good, and the person picked "Delete" on purpose.
- [Edits not saved yet are lost with the sheet.] → They belong to the sheet that is being deleted.
- [A sheet deleted in another tab is noticed only at the next save.] → Until the person edits, nothing is lost. Checking in the background would add requests for a rare case.
