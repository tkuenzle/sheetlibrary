# Tasks

## 1. The fade and the "arriving" signal

- [x] 1.1 Add the fade's keyframes and class (`opacity` 0 to 1, `--motion-short`, a new `--ease-linear` token) in a stylesheet next to `ui/skeleton.css`. Verify with `pnpm lint` and a check that reduced motion gives it a 0s duration.
- [x] 1.2 Add an "arriving" context and a hook that reads it once at mount. Make `PageData` provide true in the commit where the content replaces the skeleton, and false for whole data and from the first effect after. Verify with unit tests in `shell/awaited.test.ts`: true for content after the skeleton, false for whole data, false for a part that mounts after the arrival.
- [x] 1.3 Make `RecentOnItsWay` in `routes/sheets.tsx` provide the same context around Recent's cards. Verify with the unit tests from 1.2 or a case of its own.

## 2. Pages

- [x] 2.1 Give the fade to Sheets' list rows (`sheets/sheet-list.tsx`) and Recent's cards (`sheets/recent-sheets.tsx`). Verify with e2e cases in `e2e/loading.spec.ts`: on slow Sheets the rows and cards fade and the heading and search field don't; on Back to Sheets with slow data only Recent's cards fade; a search after the fade shows its results without one.
- [x] 2.2 Give the fade to a collection's rows, and to its name and count only when the rail didn't know them (`routes/collection.tsx`). Verify with the "slow collection" e2e case: the rows fade, "Christmas" and "3 sheets" don't.
- [x] 2.3 Give the fade to a sheet's chips and lines, and to its title and artist only without the row it was opened from (`routes/sheet.tsx`). Verify with e2e cases for a slow sheet from a row and from a link.
- [x] 2.4 Give the fade to the account page's passkey rows (`routes/account.tsx`). Verify by extending the slow account e2e case.
- [x] 2.5 Update "Rows show once the page is in" in `docs/motion.md`: drop "for now" and describe the fade and when it plays.

## 3. Dialogs

- [x] 3.1 Add a hook next to `useSkeleton` that answers "arriving" in the render where seen bars give way to the list, and use it for the rows in `collections/add-sheets-dialog.tsx` and `collections/choose-collections-dialog.tsx`. Verify with e2e cases: a slow list fades in, a quick list shows at once, and a later search in "Add sheets" shows its results without a fade.
- [x] 3.2 Mention the dialogs in the `docs/motion.md` paragraph from 2.5.

## 4. Check

- [x] 4.1 Run `pnpm typecheck` and `pnpm lint` at the root, and `pnpm test` and `pnpm e2e` in `apps/web`. With the browser-check skill on a throttled connection, check that a slow collection's rows fade in and that taps and typing work during the fade.
