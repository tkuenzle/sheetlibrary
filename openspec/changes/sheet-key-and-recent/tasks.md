# Tasks

## 1. The key from the format

- [x] 1.1 Add a `chordsheet` function that gives a sheet's key as text ("F#m", "Bb"): the set key, or else the guess, or nothing without chords; verify with unit tests for a set key, a guessed key, a minor key and a sheet without chords
- [x] 1.2 Use it where the editor and play view work out the song key today, if that keeps them the same; verify the existing `sheet-title` and route tests still pass

## 2. Data

- [x] 2.1 Add migration `0007_sheet_key_and_opens.sql`: a `key` column on `sheet` and the `sheet_open` table with its foreign keys and `("userId", "openedAt")` index; verify `just migrate-local` applies it and the `migrations.server` tests pass
- [x] 2.2 Write `key` on create and save next to `lyrics`, and return it from `listSheets`, `searchSheets` and a collection's sheets; verify with `sheets.server` and `collections.server` tests, including an import and a save that removes every chord
- [x] 2.3 Add an upsert for an opening and a read of the 4 last opened sheets, only the person's own; verify with `sheets.server` tests for order, the limit of 4, a second opening moving a sheet to the front, another person's openings, and a deleted sheet leaving the list

## 3. Recording an opening

- [x] 3.1 Record the opening in `routes/sheet.tsx`'s loader once the sheet is found, ignoring a failed write; verify with route tests that opening counts, that a missing sheet records nothing, and that a failing write still shows the sheet
- [x] 3.2 Check that `routes/sheet.edit.tsx` records nothing; verify with a route test

## 4. The key column

- [x] 4.1 Show the key in the list's third column, labelled "Key", and as "Artist · Key" on a phone, with no key cell text when there is none; remove the edit date and `last-edit.ts` if nothing else uses it; verify with `sheet-list` component tests and the `sheets` and `collection` route tests
- [x] 4.2 Give the key the name screen readers read elsewhere, such as "F sharp minor"; verify with a component test
- [x] 4.3 Update the sheet list entry in `docs/ui-text.md` (column "Key", "Artist · Key", no edit date); verify the wording matches the UI

## 5. The Recent row

- [x] 5.1 Return the recent sheets from the Sheets loader without a search, and nothing while searching; verify with route tests
- [x] 5.2 Show "Recent" between the search field and the list as cards with title, artist and key that only open the sheet, 4 across on wide screens and a sideways row on a phone, hidden while searching or when empty; deleting from a row hides its card at once and brings it back if the delete fails; verify with route tests for shown, searching, nothing opened and deleting
- [x] 5.3 Add "Recent" to the Sheets entry in `docs/ui-text.md` and the cards to `docs/design-direction.md`; verify the wording matches the UI, and add the card to the design page if it becomes a base component

## 6. End to end

- [x] 6.1 Update `e2e/library.spec.ts` and `e2e/collections.spec.ts`: the key in a row, opening two sheets and seeing them in "Recent" in order, editing only not counting, and "Recent" hidden while searching; verify `pnpm e2e` passes for both files
- [x] 6.2 Check Sheets and a collection on a phone and a wide screen with the browser-check skill; verify against the canvas boards "Sheets, desktop", "Sheets, phone" and "A collection, with the sheet menu on a row"
