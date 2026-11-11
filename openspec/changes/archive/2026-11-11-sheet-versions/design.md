# Design

## Context

A sheet is one D1 row (`migrations/0003_sheets.sql`), saved whole with a revision check (`sheets.server.ts`). The play view (`routes/sheet.tsx`) shows it in the address's `key` and `capo` through `useSheetKey` (`editor/sheet-title.tsx`). There, `shown` is the key picked over the song key, and `null` means the song key. The key panel is `KeyButton` in its `viewOnly` mode, shared with the editor.

The UX was worked out on a design canvas: https://claude.ai/artifact/4Gs5B2dpq8ohvtsEaFKsK4

## Goals / Non-Goals

**Goals:**
- A version's page is complete from the server, in its key, with its name.
- Saving or changing a version never touches the sheet's row, so it can't clash with an open editor.

**Non-Goals:**
- Changing the editor's key panel.
- Updating versions when the sheet is saved.

## Decisions

### A table of its own

`0004_sheet_versions.sql` adds `sheet_version` with `id`, `sheetId` (references `sheet`, `on delete cascade`), `name`, `key` and `createdAt`, and an index on `sheetId`. Ownership comes from the sheet: every query joins `sheet` on `userId`, so someone else's version is "not found" like someone else's sheet. Ids are made like sheet ids (`newSheetId`), so they fit in an address. The list is ordered by `createdAt`.

Alternative: keep versions in the sheet's JSON. Rejected: saving one would raise the sheet's revision and make an open editor stop with "changed in another tab".

### Store the key, not a distance

A version stores its key as written, such as "A" or "F#m". "Make A the song key" moves the chords and leaves versions alone, with nothing to update. The key also keeps its spelling, so a version saved in Gb stays Gb.

For major and minor, the shown key is worked out, never stored. A `chordsheet` helper gives the key a version shows on a sheet: its own key, or, when its major or minor differs from the song key's, the relative key, three semitones down or up. It is spelled as the keys to move to spell it. On a tie it keeps the version key's sharp or flat: Gb gives Ebm, F# gives D#m. A guessed key that turns from G to Em as chords are typed is handled the same way, with no write.

Alternative: store the distance from the sheet's chords. Changing the song key between major and minor would then need no rule, but "Make A the song key" would have to shift every version in the same save. The autosave batches edits and undo can reverse a move, so that save would have to track moves across both. Rejected as the bigger risk.

### An API beside the sheet's

`/api/sheets/:id/versions` takes GET (the list) and POST (name and key, answers with the version). `/api/sheets/:id/versions/:versionId` takes PATCH (name or key) and DELETE. The handlers live next to `handleSheet` in `sheets-api.server.ts` and answer in the same way: 401, 404, and 400 for a name or key that isn't valid. The browser calls them through small helpers like `deleteStoredSheet` (`sheets/versions.ts`). It keeps the list in state and updates it from each answer, without loading the page again.

### The loader resolves `version`

The play loader reads the sheet and its versions in one D1 batch. With `?version=` it finds the version and passes its shown key to the page. An unknown version redirects to the same address without `version` and `key`, keeping `capo` and `lyrics`, so this works without JavaScript too.

### `useSheetKey` gets a home key

Today `shown: null` means the song key. A new `home` option, the open version's shown key, makes `null` mean that key instead. The address writes `key` only when the shown key differs from home, and "Back to" names and returns to home. Opening another version, or "Song key", sets home and clears `shown`, and `useAddressParam("version", …)` writes the address. The Play/Edit switch's query carries the drawn key, so "Edit" from a version opens the editor in its key.

### The panel's top part is passed in

`KeyButton` gets an optional `songPart` for its `viewOnly` mode, which replaces the "Song key" block. The play view passes either the song key block with its "…" (no versions) or the list of versions (some). The menus use the existing `Menu`, and the list is a list of buttons with `aria-current` on the open one. The open version's menu sits inside the scrolling list, which would cut it off, so `Menu` gets a `fixed` option that places its list against the window, under the button. The list opens with the open row scrolled into view. The editor passes nothing and stays as it is. After about four rows the list gets a `max-height` and scrolls, and "Save … as a version…" stays outside it.

### A naming dialog like the confirmation

Saving and renaming share a `NameDialog` in `ui/`, built like `ConfirmDialog`: a modal with a labelled field (at most 40 characters), "Cancel" and "Save". The field starts selected, and Enter saves. While saving runs, the buttons are disabled. Deleting uses `ConfirmDialog` as it is.

## Risks / Trade-offs

- [The relative key is wrong when the song key changes between major and minor of the same tonic, such as G to Gm: Anna's A shows as F#m, not Am] → Rare, since it means the key was named wrong before. The odd key shows on the page, and "Make Am Anna's key" fixes it. If it turns out to matter, the sheet can count its moves and versions store a distance, with a migration from the stored keys.
- [The list makes the panel taller on a phone] → It only shows once a sheet has versions, and it scrolls after about four.
- [Two tabs on the same sheet see different lists] → A version saved in one tab shows in the other after a reload. Nothing is lost, since each change is one small request.

## Migration Plan

The migration only adds a table, so it runs before the new code in each environment as usual. Rolling back the code leaves the table unused.
