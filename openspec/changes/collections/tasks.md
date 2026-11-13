# Tasks

## 1. Storing collections

- [x] 1.1 Add `migrations/0006_collections.sql` with `collection` (unique on `userId` and `nameKey`) and `collection_sheet` (primary key on both ids, index on `sheetId`), with their cascades. Verify `just migrate-local` applies it, and `migrations.server.test.ts` passes.
- [x] 1.2 Add `collections.server.ts` with list (with counts), read (with sheets), create, rename, delete, add sheets (`json_each`, owner checked on both sides, `insert or ignore`) and remove, all joined on the owner and sorted A to Z with `Intl.Collator`. Verify with tests: someone else's collection and sheet are "not found", a name in another case is refused, an empty or 41-character name is refused, adding leaves the sheet's revision, deleting a collection keeps its sheets, deleting a sheet takes it out, and "Drüü Könige" sorts with D.

## 2. The library's tabs

- [x] 2.1 Add `LibraryTabs`: the Sheets and Collections tabs as a `nav` with `aria-current`, below the heading on `/sheets`. Verify `sheets.test.tsx` passes, with a case for the marked tab.
- [x] 2.2 Add the `/collections` route: the owner's collections A to Z with their counts, "No collections yet", "New collection" through `NameDialog` opening the new page, sign-in redirect and `noindex`. Verify with `collections.test.tsx` cases for the list, the empty state, a new collection and a name in use.
- [x] 2.3 Let `NameDialog`'s `onSave` reject with the note to show. Verify `name-dialog.test.tsx` covers both a passed note and the default failure, and the version dialogs still pass.

## 3. A collection's page

- [x] 3.1 Add the `/collections/:id` route: the name as heading and tab title, the count, the sheets A to Z linking to the play view, the empty state, "not found" for someone else's id, and `noindex`. Verify with `collection.test.tsx` cases.
- [x] 3.2 Give `TopBar`'s `back` a link and a label, and show "Collections" on a collection's page. Verify with a `top-bar` test and the sheet pages' tests unchanged.
- [x] 3.3 Add the remove button on each row, named "Remove Stille Nacht from Christmas", posting to the route's action. Verify with a `collection.test.tsx` case.
- [x] 3.4 Add the menu with "Rename" (through `NameDialog`, a name in use keeps it open) and "Delete" (through `ConfirmDialog`, saying the sheets stay, then opening `/collections`). Verify with `collection.test.tsx` cases.
- [x] 3.5 Add the "Add sheets" picker: the library's list and search through `useFetcher().load("/sheets?q=…")`, rows already in the collection ticked and disabled, "Add 2 sheets" disabled while none is ticked, "Cancel" adding nothing. Verify with `collection.test.tsx` cases.

## 4. From the play view

- [x] 4.1 Add `/api/sheets/:id/collections` (GET with whether each holds the sheet, POST to make one with the sheet) and `/api/sheets/:id/collections/:collectionId` (PUT, DELETE), answering 401, 404, 400 and 409. Verify with API tests for each method and answer.
- [x] 4.2 Add the "Add to collection…" dialog: load the list when it opens, tick and untick save at once and undo a failed tick with a note, "New collection" adds it ticked, "Done" and Escape close. Verify with `sheet.test.tsx` cases against a stubbed fetch.
- [x] 4.3 Put "Add to collection" in the top bar before "Smaller text" on a wide screen, and after "Lyrics only" in the phone's menu. Verify with `sheet.test.tsx` cases for both.

## 5. Tests across pages and docs

- [x] 5.1 Add `e2e/collections.spec.ts`: make a collection, add sheets with the picker and from a sheet, remove one, rename, delete and find the sheets still in the library, on a wide screen and a phone. Verify they pass.
- [x] 5.2 Add collections to `docs/ui-text.md`: "collection" in the glossary, the tabs, the empty states, the dialogs, the remove button's name and the delete confirmation. Verify the words match the pages.

## 6. In a browser

- [x] 6.1 With the `browser-check` skill, go through the tabs, a collection, both ways of adding, and the dialogs, at desktop and phone width, in light and dark. Verify against the canvas page "Collections".
- [x] 6.2 Run `pnpm test`, `pnpm typecheck`, the linter and the e2e suite. Verify all pass.

## Workflow follow-up

- Open issues for the proposal's open questions the user wants to keep, such as tags and filtering the library by collection, after asking the user.
