# Proposal

## Why

The list on Sheets and in a collection shows when each sheet was last edited. That helps while editing, not when looking for a song to play. The library can't show the key, because the key sits inside the content, and nothing records when a sheet was opened. This is step 3b of the UX overhaul (#145), split off from #132.

## What Changes

- The list's third column shows each sheet's key: the key that was set, or else the one guessed from the chords. A guessed key looks the same as a set one. A sheet without chords shows no key. On a phone the row reads "Artist · Key".
- The key is stored beside the content when a sheet is created or saved, as the lyrics are. Existing sheets are not filled in; each gets its key on its next save.
- The edit date leaves the list. "Last edited" stays as an order.
- Opening a sheet to play records when the person opened it. Opening Edit doesn't.
- Sheets shows a "Recent" row with the 4 sheets opened last, as cards with title, artist and key, between the search field and the list. A card only opens the sheet; it has no menu. Deleting a sheet from its row takes its card away at once. The row is hidden while searching and when nothing has been opened yet. On a phone the cards are a row that scrolls sideways.
- On Sheets, the list gets the heading "All sheets" with how many sheets there are, on the order control's line. It is hidden while searching, where the search field already gives the count. A collection keeps its count under its name.
- Not in this change: the capo in the list (a capo isn't stored on a sheet), "Last opened" as an order, and a "Recent" row in a collection.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `sheet-list`: a row shows the key in place of when the sheet was last edited.
- `library-page`: the requirement on how the edit date is written goes; Sheets gets the "Recent" row.
- `sheet-envelope`: library features may also use the key the content's format gives, not only its plain text.

## Impact

- `packages/chordsheet`: a function that gives a sheet's key as text, such as "F#m" (the set key, or else `guessKey`), next to `plainLines`.
- A migration: a `key` column on `sheet`, empty by default, and a `sheet_open` table with one row per person and sheet.
- `sheets/sheets.server.ts`: write the key on create and save; return it from the list and from search; record an opening; read the recent sheets. `collections/collections.server.ts`: return the key with a collection's sheets.
- `routes/sheet.tsx` (its loader records the opening), `routes/sheets.tsx`, `sheets/sheet-list.tsx` and their tests and CSS. `sheets/last-edit.ts` may no longer be needed.
- `docs/ui-text.md`: the sheet list and Sheets entries.
- `e2e/library.spec.ts`, `e2e/collections.spec.ts`.

## Open Questions

- Is a sheet opened from the editor's top bar ("Play") counted, like any other opening of the play view?
