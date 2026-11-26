# Tasks

## 1. Spikes

- [x] 1.1 Give `routes/api.collection.ts` a `clientAction` that wraps `serverAction()`, and check by hand what it gets for a 200, a 409 and a 204, and for a server it can't reach. If it can't tell them apart, switch the design to the `sendChange` fallback and note it in design.md before going on.
- [x] 1.2 Add `routes/api.passkeys.ts` with only a `clientAction` to `routes.ts`, and check by hand that a fetcher reaches it and the shell loads again after. If React Router refuses it, switch to a `clientAction` on `routes/account.tsx` and note it in design.md.

## 2. Shared pieces

- [x] 2.1 Give the API's error bodies a `code`, with tests in the API's test files. Add the helper that turns a server answer into `{ ok: true }`, `{ ok: false, refused }` or `{ ok: false }`, with unit tests for success, a name already used, another error and a thrown error.
- [x] 2.2 Grow `useNewCollection` into one hook from a fetcher to `onSave`: resolves on ok, throws `NameRefused` on refused, throws on `{ ok: false }`, and resolves when the fetcher goes idle without an answer. Verify with unit tests for all four.
- [x] 2.3 Make `useCollectionsRoutes()` take the route ids to load. Verify with `collections/sheet-collections.test.ts` and the "Choose collections…" offline e2e cases.
- [x] 2.4 Switch `api.sheet-collections.ts` and `api.sheet-collection.ts` to `serverLoader()` and `serverAction()` with the helper. Verify with the dialog's e2e cases in `e2e/collections.spec.ts`, offline ones included.

## 3. Collections

- [x] 3.1 Give `api.collections.ts` a `clientAction` that redirects to the new collection, and make "New collection" on Collections and in "Choose collections…" use the hook. Remove the `revalidate()` in `routes/collections.tsx`. Verify with "makes a collection, fills it, renames it and deletes it" and "says when a new collection's name is already used".
- [x] 3.2 Give `api.collection.ts` a `clientAction` for renaming, and for deleting with a redirect to `/collections`, and make the collection's Rename and Delete use the hook. Remove the `revalidate()` calls in `routes/collection.tsx`. Verify with the same e2e case, and add one that renames offline: the dialog's note shows and the page stays.

## 4. Rows

- [x] 4.1 Give `api.sheet.ts` a `clientAction` for `DELETE`, and make a row's "Delete" submit there. Verify with "deletes a sheet from its row, after asking" and "brings the row back when the delete doesn't get through", on Sheets and in a collection.
- [x] 4.2 Make "Remove from …" submit `DELETE` to the sheet-collection route. Verify with an e2e case that removes a sheet from a collection, and one offline where the row comes back with its note.
- [x] 4.3 Add `POST /api/collections/:id/sheets` with its handler in `collections-api.server.ts`, tests in `collections-api.server.test.ts`, and a `clientAction`. Make "Add sheets" submit there. Verify with the "Add sheets" e2e case, and one offline where the dialog shows its note.
- [x] 4.4 Remove the row changes from the actions of `routes/sheets.tsx` and `routes/collection.tsx`, with `keepListOnFailure` and `rowAnswer`. Verify with `pnpm test` in `apps/web` and the "New sheet" e2e cases.

## 5. Passkeys

- [x] 5.1 Make `/api/passkeys` add, rename and remove a passkey, and make the account page submit there through fetchers, keeping the note when adding fails. Remove its `useRevalidator()`. Verify with `routes/account.test.tsx` and a new e2e case with a virtual authenticator: add, rename and remove, and the list follows each time.

## 6. Deleting on the sheet page

- [x] 6.1 Remove the `revalidate()` after a delete in `routes/sheet.tsx` and `routes/sheet.edit.tsx`. Verify with an e2e case that opens a sheet from a collection, deletes it, and finds it gone from the list and the rail's count, from the play view and from edit mode.

## 7. Check

- [x] 7.1 Remove the browser calls in `collections/collections-client.ts` that nothing uses, and update the comments in `shell/revalidate.ts` and the routes that still talk of `revalidate()`. Verify that `revalidate` is only left in `shell/kept.ts`, and run `pnpm typecheck` and `pnpm lint` at the root.
- [x] 7.2 Run `pnpm test` and `pnpm e2e` in `apps/web`, and check renaming a collection and removing a passkey on a phone with the browser-check skill.
