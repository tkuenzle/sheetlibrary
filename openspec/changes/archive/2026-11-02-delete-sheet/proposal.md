# Proposal

## Why

People need to remove sheets they no longer want (#77). The API can already delete a sheet, but the app offers no way to do it. Once it does, a sheet can be deleted while it is still open in another tab. That tab would then try to save forever, because autosave counts the server's "not found" as a failure worth retrying.

## What Changes

- The sheet's menu gets "Delete", below "Rename".
- "Delete" asks first, in a dialog: "Delete “Amazing Grace”?", "The sheet is gone for good. This can’t be undone.", with "Cancel" and "Delete". There is no undo.
- Confirming deletes the sheet, stops autosave and goes back to the library. Edits that aren't saved yet are dropped with the sheet.
- If the delete can't reach the server, the dialog stays open and says the sheet couldn't be deleted. If the sheet is already gone, the page goes to the library as if the delete worked.
- "Delete" stays enabled after the sheet changed in another tab.
- When a save finds the sheet gone, the page stops saving and becomes read-only. The save state says "Not saved", and a note says "This sheet was deleted." with a link back to the library. The edits stay on screen so they can be copied.
- After that, "Rename" and "Delete" are disabled. Leaving the page still asks first, as after a conflict, so the edits can be copied before they are gone.
- Leaving the sheet page while a save is under way no longer leaves autosave retrying in the background.

The look follows the canvas's "Delete, from the sheet" board (see design.md).

Not part of this change:

- Deleting from the library. It has no row menu, and the issue adds one only if it turns out to be needed.
- Keeping deleted sheets for a while, so a delete can be undone.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `sheet-page`: the sheet's menu holds "Delete", which asks first and goes back to the library, and the page handles a sheet deleted elsewhere.

## Impact

- `apps/web/app/routes/sheet.tsx`: "Delete" in the menu, the dialog, and the note for a deleted sheet.
- `apps/web/app/sheets/autosave.ts`: a new final state for a sheet that is gone, and a stop that also ignores a save answering late, used before the delete and when the page closes.
- `apps/web/app/ui/`: a small confirm dialog, the second dialog in the app after the import.
- `apps/web/app/ui/icons.ts`: the `delete` icon.
- `docs/ui-text.md`: words for "Delete", the dialog and the note.
- No API change, no migration, no new dependencies.
