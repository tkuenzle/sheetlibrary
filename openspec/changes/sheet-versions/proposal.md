# Proposal

## Why

A song is often played in another key than the sheet's, for example for another singer (#116). The play view shows a sheet in another key only through its address (#82), and nothing keeps that key or says who it is for.

## What Changes

- A sheet can have versions. A version is a name and a key, named for who or what it is for, such as "Anna's key" in A. It doesn't copy the chords, so it follows later edits to the sheet. It holds no capo (#125 adds a suggested one) and no lyrics only.
- Versions are stored apart from the sheet, belong to its owner and are deleted with it. Saving a version doesn't change the sheet or its revision.
- When the song key changes between major and minor without moving the chords, versions change with it, to the relative key: Anna's A becomes F#m when G becomes Em. "Make A the song key", which moves the chords, leaves versions' keys as they are.
- A version has its own address, `/sheets/:id?version=…`, with `key` next to it when another key is shown. The play view shows the version's name after the artist, also in print. A link to a version that is gone opens the sheet in its song key.
- Without versions, the key panel stays as it is today. A "…" beside the song key holds "Save A as a version…".
- With versions, the panel lists them where the song key was, with "Song key" first, one line each, and "Save A as a version…" at the end. A row opens that version, or the sheet in its song key. The list scrolls after about four versions.
- Saving asks for a name in a small dialog, filled in with "Key A".
- Another key in a version keeps the version open, and "Back to A" goes back to its key. The "…" on the open version's row holds "Make Bb Anna's key" while it is shown in another key, "Rename…" and "Delete…". "Delete…" asks first. Afterwards, the sheet stays in the key it was shown in, with no version open.
- "Edit" from a version opens the editor in the version's key, as it carries the shown key today.
- Not in this change: versions in the editor, a count in the library, a capo for each player (#36), and sets holding a version (#34, #35).

## Capabilities

### New Capabilities

- `sheet-versions`: what a version holds, who it belongs to, how it is stored apart from the sheet, and how its key follows the song key's major or minor.

### Modified Capabilities

- `play-page`: opening a version by its address, its name on the page, the versions in the key panel, and saving, changing, renaming and deleting a version.

## Impact

- `apps/web/migrations/`: a new table for versions, deleted with their sheet.
- `apps/web/app/sheets/`: storing versions, and an API for them under `/api/sheets/:id/versions`.
- `packages/chordsheet`: the key a version shows on a sheet in major or minor.
- `apps/web/app/routes/sheet.tsx` and `sheet.css`: the loader reads `?version`, the name after the artist, the save and rename dialog, and the delete confirmation.
- `apps/web/app/editor/key-button.tsx`: the play view's panel gets the list of versions, the song key's "…", and the version's "…". The editor's panel doesn't change.
- `apps/web/e2e/play.spec.ts`: versions on a wide screen and a phone.
- `docs/ui-text.md`: the new labels, the dialog and the confirmation.
- The sheet and its API don't change. The design canvas: https://claude.ai/artifact/4Gs5B2dpq8ohvtsEaFKsK4

## Open Questions

- A version saved in Gb on a minor sheet becomes Ebm, but one in F# becomes D#m. Is keeping the sharp or flat of the saved key right?
- Should "Play" in the editor go back to the version it came from? As planned, the editor knows no versions, so "Play" opens the sheet in that key without the version.
- What should saving, renaming or deleting a version do when the network is down: keep the dialog open and say it didn't work, as deleting a sheet does?
- Should a sheet have a limit on how many versions it can have?
