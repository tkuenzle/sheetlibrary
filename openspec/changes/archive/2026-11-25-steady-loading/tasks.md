# Tasks

## 1. Fetchers that answer when offline

- [x] 1.1 Add a `clientLoader` and `clientAction` to `routes/api.sheet-collections.ts` and `routes/api.sheet-collection.ts` that turn a failure to reach the server, or a refused change, into an answer: `{ ok: false }` for a change, a failed answer for the list, and the 409 for a name already used. Verify by hand, with a fetcher on a sheet's page offline, that the page stays and no error boundary shows. If it doesn't hold, stop and switch to the fallback in design.md before going on.
- [x] 1.2 Add `useSheetCollections(sheetId, initial?)` over a fetcher keyed `collections:<sheetId>`, with unit tests for "answers `initial` until loaded" and "answers the loaded list".
- [x] 1.3 Load the two API routes' code as soon as a page that can open the dialog shows, and make every load and change wait for it, failing with the dialog's notes when it can't load (see design.md). Verify with e2e cases offline: opening a row's menu on Sheets, and a first tick on a sheet.

## 2. The dialog on fetchers

- [x] 2.1 Make ticks in `ChooseCollectionsDialog` submit through one fetcher per collection, showing the pending tick and going back with the note on `{ ok: false }`. Verify with the dialog's existing e2e cases in `e2e/collections.spec.ts` and `e2e/sheet.spec.ts`.
- [x] 2.2 Make "New collection" in the dialog submit `POST` through a fetcher, with `NameDialog` showing "That name is already used." on a 409. Verify with an e2e case for a name already used.
- [x] 2.3 Remove the dialog's `onChange` prop, the `collectionsChanged` refs and their `revalidate()` calls in `routes/sheet.tsx`, `routes/sheet.edit.tsx` and `sheets/sheet-list.tsx`, and the browser calls in `collections-client.ts` that nothing uses any more. Verify with `pnpm typecheck` and `pnpm lint`.

## 3. Open with what the page knows

- [x] 3.1 Make the sheet's loader pass every collection with its tick, and have the chips and the dialog read `useSheetCollections` with it as `initial`. Verify with an e2e case: on a sheet's page with slow collection requests, the dialog opens with its ticks and no bars.
- [x] 3.2 Make Edit's loader read `sheetCollections()` and pass it to the dialog the same way. Verify with the same e2e case in edit mode.
- [x] 3.3 Add `shouldRevalidate` to the sheet and Edit routes that skips their own loader after a submission to the sheet-collections routes, with unit tests beside `routes/shell.test.tsx`'s.
- [x] 3.4 Start `fetcher.load()` when a row's menu opens on Sheets and in a collection. Verify with e2e cases: a slow list shows bars in the dialog, and a quick one shows none. Check that the rail counts one more after a tick, before "Done".
- [x] 3.5 Make `useSkeleton` take its bars away when they have shown longer than their hold before the data comes. Verify with an e2e case that holds the list until well after the bars show.

## 4. Passkey skeleton

- [x] 4.1 Add a passkey count beside `hasPasskey()` in `auth/passkeys.server.ts`, with a test in `passkeys.server.test.ts`, and load it in the shell's loader in parallel with the collections.
- [x] 4.2 Make the account page's skeleton show one row per passkey, with room for Rename and Remove, or "No passkeys yet" with none. Verify by extending the account case in `e2e/loading.spec.ts`: on a phone, the real row takes the skeleton's place without the rows below it moving.

## 5. Check

- [x] 5.1 Run `pnpm typecheck` and `pnpm lint` at the root, `pnpm test` and `pnpm e2e` in `apps/web`, and check "Choose collections" on a phone with the browser-check skill: it opens from a sheet without changing size.
