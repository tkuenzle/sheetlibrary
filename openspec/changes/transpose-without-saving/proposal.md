# Proposal

## Why

Picking another key is often about playing the sheet, for example for another singer, not about changing it. Today a transpose rewrites and saves the stored chords, so after a reload the new key counts as the song's own, and "Back to G" no longer goes back (#82).

## What Changes

- A transpose changes how the sheet is shown, not what is stored. The chords and the song key stay as they are, and nothing is saved.
- The shown key is in the page's address, as `?key=A`, in the usual spelling, encoded (`?key=F%23m`). A reload or a copied link opens the sheet in that key. Picking a key or a step replaces the address instead of adding to the history. In the song key, there is no `?key`.
- A `?key` that isn't a key the sheet can be shown in is left out, and the sheet shows in its song key.
- A chord added or edited while transposed is stored moved back to the song key.
- **BREAKING** Undo no longer covers a transpose.
- "Back to G" goes back to the song key.
- New: "Make A the song key", next to "Back to G", moves the stored chords to the shown key, as one edit to undo, and leaves the song key shown.
- Setting the song key with "Change" while transposed keeps the distance between the song key and the shown key, so no label changes.
- A sheet that changed in another tab or was deleted can still be transposed.
- Not in this change: storing a key to play in, which is #116.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `editor-page`: the key panel transposes the shown key, kept in the address. Undo no longer covers it, "Back" goes to the song key, "Make … the song key" is new, and "Change" keeps the shown distance.
- `sheet-page`: a transpose doesn't save. Making the shown key the song key does. A read-only sheet can still be transposed.

## Impact

- `packages/chord-editor`: chord labels are drawn in the shown key. The `original` doc attribute and the commands around it change.
- `apps/web/app/editor`: `useSheetKey` and `SheetTitle` (`sheet-title.tsx`), `key-button.tsx`, and the chord input's suggestions and commit in `sheet-editor.tsx`.
- `apps/web/app/routes`: `sheet.tsx` and `editor.tsx` read `?key` for the first render.
- Stored sheets don't change.

## Open Questions

- Should the key button show that it isn't the song key, for example "Key A · song in G"?
- When the guessed song key changes after an edit, should the shown key keep its distance too, as with "Change"?
- Does an Ultimate Guitar import on `/editor` drop `?key`?
- Is "Make A the song key" always there and disabled in the song key, like "Back", or only shown while transposed?
