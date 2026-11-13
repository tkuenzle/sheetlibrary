# Design

## Context

Sheets are rows in D1, each saved whole with a revision check (`sheets.server.ts`). Versions already show how to keep related data apart from a sheet: their own table, owned through the sheet, so saving one never clashes with an open editor (`0004_sheet_versions.sql`). The library at `/sheets` is one route with its own loader, search and actions (`routes/sheets.tsx`). `NameDialog` and `ConfirmDialog` in `ui/` cover naming and deleting.

The UX is on the design canvas, page "Collections": https://claude.ai/artifact/DcmNjZGDmLtgu7mwb8jyi5

## Goals / Non-Goals

**Goals:**
- A collection is a row with its own id and owner, so sharing can later be granted on it.
- Adding and removing sheets never touches a sheet's row.

**Non-Goals:**
- Any sharing table or rule. Only the shape is chosen with it in mind.
- An order of sheets in a collection. Sets (#35) bring their own.

## Decisions

### Two tables

`0006_collections.sql` adds:

- `collection`: `id`, `userId` (references `user`, `on delete cascade`), `name`, `nameKey`, `createdAt`, `updatedAt`, with a unique index on (`userId`, `nameKey`).
- `collection_sheet`: `collectionId` (references `collection`, `on delete cascade`), `sheetId` (references `sheet`, `on delete cascade`), `addedAt`, with (`collectionId`, `sheetId`) as the primary key and an index on `sheetId`.

The cascades give "deleting a collection keeps its sheets" and "deleting a sheet takes it out of its collections" for free, as for versions. Ids are made with `newSheetId`, so they fit in an address and can't be guessed.

`nameKey` is the trimmed name in Unicode NFC, lower-cased by the app. SQLite's `lower()` and `nocase` only fold ASCII, so "Äpfel" and "äpfel" would both get in. A save that breaks the unique index is answered as "name in use".

Alternative: a tag-like label on each sheet. Rejected in exploration: a label has no owner or id to share.

Later, sharing can add a `collection_share` table, and reading a sheet can also allow "is in a collection shared with me". That rule changes `sheet-storage`, and nothing here has to move for it.

### Ownership in every query

Every query joins `collection` on `userId`, so someone else's collection is "not found", like a sheet. Adding sheets inserts from a `select` that joins both `collection` and `sheet` on the same `userId`. A sheet that isn't the owner's is skipped, and the call answers "not found" when nothing was added. The sheet ids come in as one JSON array read with `json_each`, so a large pick stays one statement within D1's limit on bound values. `insert or ignore` makes adding a sheet that is already there a no-op.

### A–Z sorted in the app

Collections and their sheets are sorted with `Intl.Collator(undefined, { sensitivity: "base", numeric: true })` after the query, so "Drüü Könige" sorts with D and "Lied 2" comes before "Lied 10". SQL `order by` can't do this. A person's collections are few, and a collection holds at most a few hundred sheets.

### Buttons use route actions, dialogs an API

`/collections` and `/collections/:id` are new routes. Removing a sheet and adding the picked ones post to the collection's action with an `intent`, through `useFetcher`. React Router then loads the page again on its own, so counts and lists stay right without extra state.

The naming dialogs wait on a promise and must tell "name in use" from "couldn't save", which a fetcher's answer gives them only clumsily. So making, renaming and deleting a collection, and the play view's dialog, use a JSON API like the versions API:

- `POST /api/collections`: make a collection. `PATCH` and `DELETE /api/collections/:id`: rename or delete it.
- `GET /api/sheets/:id/collections`: the owner's collections, each with whether it holds the sheet.
- `PUT` and `DELETE /api/sheets/:id/collections/:collectionId`: add or take out the sheet. Both can be repeated.
- `POST /api/sheets/:id/collections`: make a collection with the sheet in it.

The play view's dialog loads the list when it opens, not in the play loader, so playing a sheet costs nothing extra. All routes call one `collections.server.ts`, and answer 401, 404, 400 for a bad name and 409 for a name in use. The browser turns a 409 into a `NameRefused`, whose note `NameDialog` shows.

### The picker reuses the library's loader

"Add sheets" loads `/sheets` and `/sheets?q=…` with `useFetcher().load`, so its list and search are the library's own, with the same matching and order. The collection's loader gives the ids it holds, to tick and disable those rows. The picker posts the ticked ids to the collection's action.

### Tabs as a shared header

`/sheets` and `/collections` stay two routes, each with its own loader and `meta`. Both put a `LibraryTabs` component below their heading: a `nav` of two links with `aria-current="page"` on the open one. The heading and the actions stay in each route, since the library already places them differently with and without sheets. This is not an ARIA tab list, since each tab is its own page.

Alternative: a layout route around both. Rejected: the actions and the search differ per tab, so the layout would hold little but the heading.

### Small changes to shared parts

- `TopBar`'s `back` also takes a link and a label, `{ href: "/collections", label: "Collections" }`. The sheet pages keep passing `true` for the library.
- `NameDialog`'s `onSave` can reject with the note to show, so "That name is already used" and "Couldn't save" can both show in it. Versions keep passing their one failure.
- The menu on the play view gets "Add to collection…", and the top bar gets an `IconButton` before "Smaller text".
- "Add to collection…" holds the "New collection" dialog inside its own. React passes the inner dialog's `close` up to the outer one, so the outer one only acts on its own.

## Risks / Trade-offs

- [Two tabs see different collections in the play view's dialog] → It loads the list each time it opens. Each tick is one small request, so nothing is lost.
- [A tick that fails leaves the box wrong] → The box goes back, and the dialog shows a note that the change couldn't be saved.
- [The picker lists every sheet without a search] → The library does the same today. If it gets slow, both can page together.

## Migration Plan

The migration only adds two tables, so it runs before the new code in each environment as usual. Rolling back the code leaves the tables unused.
