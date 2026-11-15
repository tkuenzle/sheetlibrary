# Tasks

## 1. Data

- [x] 1.1 Return `createdAt` from `listSheets`, and `updatedAt` and `createdAt` with a collection's sheets in `readCollection`; verify with the `sheets.server` and `collections.server` tests
- [x] 1.2 Add the first three titles, A to Z, to each item of `listCollections` in one batch; verify with a `collections.server` test for a collection of four sheets and an empty one

## 2. Order

- [x] 2.1 Add the order cookie (read, keep, default "Title, A to Z") and one sort function for the four orders, artist-less sheets last; verify with unit tests, including "Drüü" sorting with "D"
- [x] 2.2 Pass the order from both pages' loaders; verify with route tests that a request with the cookie renders the list in that order

## 3. The shared list and row menu

- [x] 3.1 Build the shared list from the Sheets list: rows with title, artist and last edit, the order control (hidden while searching), and a "More for …" menu with "Choose collections…" and "Delete"; verify with component tests for both menus and for the control while searching
- [x] 3.2 Use it on Sheets and on a collection, with "Remove from …" before "Delete" in a collection, and remove the row's remove button; verify with the `sheets` and `collection` route tests
- [x] 3.3 Open the existing "Choose collections…" dialog from a row, and reload the page once when it closes after a change; verify with a route test that the rail count follows

## 4. Delete and remove from a row

- [x] 4.1 Add `intent=delete` to both pages' actions, keeping "New sheet" as Sheets' default; verify with action tests, including another person's sheet answering "not found"
- [x] 4.2 Add a `clientAction` to both pages that turns an unreachable server into `{ ok: false }`; verify with route tests that the list stays and no error boundary shows
- [x] 4.3 Confirm before deleting from a row, hide the row while pending or done, bring it back with a note when it fails, and move the focus to the heading; verify with component tests for confirm, cancel and failure

## 5. Collections cards

- [x] 5.1 Show each collection as a card with name, count and first titles, in a grid on wide screens and two columns on phones; verify with the `collections` route test and on the design page if the card is a new base component

## 6. Docs and end to end

- [x] 6.1 Add the new labels ("More for …", the four orders, "Remove from …", the delete note) to `docs/ui-text.md` and the list and cards to `docs/design-direction.md`; verify the wording matches the UI
- [x] 6.2 Update `e2e/library.spec.ts` and `e2e/collections.spec.ts` for A to Z, choosing an order that survives a reload and carries to a collection, deleting and removing from a row, and deleting offline; verify `pnpm e2e` passes for both files
- [x] 6.3 Check Sheets, a collection and Collections on a phone and a wide screen with the browser-check skill; verify against the canvas boards
