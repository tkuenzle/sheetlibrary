## Why

The library is one long list. People want to group sheets the way they think of them, such as "Christmas" or "Kinderlieder" (#34). Sharing will come later and should work per group, so a group needs to be a thing of its own, with an owner, not a label on sheets.

## What Changes

- A person can make collections: named groups of their own sheets. A sheet can be in any number of collections. A collection has no order; its sheets are listed A to Z.
- The library gets two tabs, each with its own address: Sheets at `/sheets`, as today, and Collections at `/collections`. The Collections tab lists the collections A to Z, with how many sheets each holds, and has "New collection".
- Each collection has its own page at `/collections/:id`, with its sheets, "Add sheets", and a menu with "Rename" and "Delete". Each row has a button to remove the sheet from the collection. Deleting a collection keeps its sheets.
- "Add sheets" opens a picker with the library's search, to add several sheets at once.
- The play view gets "Add to collection…". It lists the collections with a tick for the ones the sheet is in, and offers "New collection".
- On a collection's page, the top bar starts with "Collections" and a back arrow.
- Adding or removing sheets doesn't change a sheet or its revision. Deleting a sheet takes it out of its collections.
- Not in this change: tags, ordered groups (songbooks and setlists come with sets, #35), filtering the library by collection, and sharing.

## Capabilities

### New Capabilities

- `collections`: what a collection is, its name, who it belongs to, which sheets it can hold, and how it is stored apart from the sheets.
- `collection-page`: the page of one collection: its sheets, adding and removing sheets, renaming and deleting it.

### Modified Capabilities

- `library-page`: the library gets the Sheets and Collections tabs, and the Collections tab with "New collection".
- `play-page`: "Add to collection…", in the top bar on a wide screen and in the menu on a phone.
- `site-layout`: the top bar on a collection's page starts with "Collections" and a back arrow.

## Impact

- `apps/web/migrations/`: a `collection` table and a `collection_sheet` table, both removed with their owner, and `collection_sheet` rows removed with their sheet.
- `apps/web/app/sheets/` (or a new `app/collections/`): server functions and an API for collections and their sheets, like the one for versions.
- `apps/web/app/routes.ts`: `/collections`, `/collections/:id` and the API routes.
- `apps/web/app/routes/sheets.tsx`: the tabs. `sheet.tsx`: "Add to collection…". `app/shell/top-bar.tsx`: the back link to Collections.
- `apps/web/e2e/`: making a collection, adding sheets both ways, removing one, deleting a collection.
- `docs/ui-text.md`: "collection" in the glossary, and the new labels.
- The design canvas, page "Collections": https://claude.ai/artifact/DcmNjZGDmLtgu7mwb8jyi5

## Open Questions

- From a sheet opened in a collection, should the top bar go back to the collection instead of the library?
- Should tags be parked as an issue, or dropped?
- Should filtering the library by one or more collections get its own issue now?
- Should removing a sheet from a collection ask to confirm, or offer undo? As planned, it does neither.
- In "Add to collection…", each tick saves at once and "Done" only closes. Is that right?
- In "Add sheets", sheets already in the collection show ticked and can't be unticked. Is that right?
- Should a row on the Collections tab show the first few titles of the collection, as in the mockups?
