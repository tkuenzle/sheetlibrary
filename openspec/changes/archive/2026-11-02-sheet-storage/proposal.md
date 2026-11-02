# Proposal

## Why

Sheets only live in the browser today, and a reload loses them. Storing them online, behind the account from #49, makes Sheet Library usable for the first time (#50). The library page (#51) builds on this.

## What Changes

- Sheets are stored in the D1 database that already holds accounts. Each sheet belongs to one person.
- An API on the Worker under `/api/sheets` to create, read, save and delete a person's sheets. Only the owner can reach a sheet. Anyone else gets "not found".
- A save names the revision it was based on. A save based on an old revision is refused, so two tabs never overwrite each other silently.
- A page at `/sheets/:id` opens a stored sheet in the editor. Edits save on their own, and the page shows whether they are saved.
- When a save is refused because the sheet changed elsewhere, the page stops saving, makes the editor read-only and says to reload.

Not part of this change:

- A way to reach a sheet from the UI: the library page, creating, renaming and deleting sheets there (#51).
- Importing from Ultimate Guitar into a stored sheet (#51).
- What happens to the `/editor` demo (#51).
- Exporting all sheets (#74).

## Capabilities

### New Capabilities

- `sheet-storage`: storing a person's sheets online, who can reach them, and refusing stale saves.
- `sheet-page`: the page that edits a stored sheet, saves on its own and shows the save state.

### Modified Capabilities

None. The `/editor` demo stays as it is.

## Impact

- `apps/web`: a `sheet` table in a new migration, a resource route under `/api/sheets`, a new `/sheets/:id` page that reuses the editor, key button and help.
- `apps/web/app/editor/sheet-editor.tsx`: the page needs to hear about every edit, not only whether the sheet differs from the loaded one, and the editor needs a read-only mode.
- `docs/ui-text.md`: words for the save state and the conflict notice.
- No new dependencies and no infrastructure changes. Previews already have their own database.

## Open Questions

- After signing in from `/sheets/:id`, should the person land back on the sheet? `/account` today just sends them to `/sign-in`.
- What the page does if the editor can't hand back a valid sheet, so there is nothing valid to save.
- Whether a sheet that is open in two tabs should warn before the first conflict, not only after.
