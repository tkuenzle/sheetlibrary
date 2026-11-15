# Proposal

## Why

What you can do with a sheet depends on where you are. Collections can only be chosen from Play and Delete only from Edit, and the library list offers nothing. The library and a collection each have their own list, sorted differently, and a collection has a remove button on every row. This is step 3 of the UX overhaul (#132), inside the shell from #131.

## What Changes

- Sheets and a collection show sheets in one shared list: title, artist and when each was last edited.
- Every row gets a menu: "Choose collections…" and "Delete", plus "Remove from …" inside a collection. The remove button on each row goes away.
- Edit, Rename and Print stay on the sheet itself, so there is one way to edit.
- Sheets sort A to Z by title. A choice of order offers Title, Artist, Last edited and Last added. The choice is kept on the device and also applies in a collection. While searching, results keep their best match first and the choice is hidden.
- The Collections screen shows each collection as a card with its name, its number of sheets and its first few titles.
- Delete and remove take the row away at once, and bring it back with a note if the server refuses.
- Not in this change: the key column and the "Recent" row (#145), Print from a row (#146), "Add to a set…" and "Share…" (#35, #36), and the sheet's own bar and menu (#134).

## Capabilities

### New Capabilities
- `sheet-list`: the list of sheets that the library and a collection show, and later a set: its rows, its order and each row's menu.

### Modified Capabilities
- `library-page`: Sheets uses the shared list and sorts A to Z, not newest edit first; scenarios that expect a new sheet to be listed first change; Collections shows cards with first titles.
- `collection-page`: a collection uses the shared list; "Remove from …" moves from a button on each row into the row's menu.

## Impact

- `routes/sheets.tsx`, `routes/collection.tsx`, `routes/collections.tsx` and their tests and CSS.
- A new shared list and row menu component; `collections/choose-collections-dialog.tsx` is reused from rows.
- `sheets/sheets.server.ts` (list with when each sheet was added), `collections/collections.server.ts` (sheets with dates; first titles per collection).
- `e2e/library.spec.ts`, `e2e/collections.spec.ts`.
- No new stored data and no migration.

## Open Questions

- After "Choose collections…" on a row inside a collection, if the person unticks this collection, should the row leave the list when the dialog closes?
- Where does the focus go after a row is deleted or removed: the heading, as removing does today, or the next row?
- What does a card show for an empty collection: "No sheets yet" in place of the titles?
- With two sheets of the same title, what decides their order: the artist?
