# Tasks

## 1. Lyrics as plain text

- [x] 1.1 Add `plainLines(content)` to `packages/chordsheet`: each line's text in order, one per line, without chords or labels, leaving out lines with only chords and dropping U+E000 and U+E001. Verify with tests for the spec's two scenarios.

## 2. The index

- [x] 2.1 Teach `statements()` in `db/migrations.server.ts` to keep a `create trigger … begin … end` whole. Verify with a `migrations.server.test.ts` case for a file with a trigger between two statements.
- [x] 2.2 Add `migrations/0005_library_search.sql`: the `lyrics` column, filled with `json_tree`, `sheet_fts`, the three triggers and `rebuild`. Verify `just migrate-local` applies it with wrangler, and `migrations.server.test.ts` passes.
- [x] 2.3 Write `lyrics` with `plainLines` in `createSheet` and `saveSheet`. Verify with `sheets.server.test.ts` cases: a saved sheet's `lyrics` column holds its lyrics, and the migration's `json_tree` fill gives the same text as `plainLines` for a sheet with labels and a chords-only line.

## 3. Searching

- [x] 3.1 Add the query builder: under 2 characters means no search; each word quoted as a prefix; quotes dropped; words without a letter or digit left out. Verify with unit tests for `grac`, `"grace -`, `a` and `grace newton`.
- [x] 3.2 Add `searchSheets(db, userId, q)` to `sheets.server.ts`, ordered by `bm25(sheet_fts, 20, 5, 1)`, returning title and artist as parts and, for lyrics-only matches, the first matching line, cut to keep the match in view. Verify with `sheets.server.test.ts` cases: "konige" finds "Drüü Könige", "race" doesn't find "Grace", a title match comes before a lyrics match, someone else's sheet isn't found, a renamed sheet is found by its new title, and after deleting a sheet, or its owner, nothing of it is found.

## 4. The library page

- [x] 4.1 In the loader in `routes/sheets.tsx`, search when `q` has 2 characters or more, otherwise list as today, and say whether the person has any sheets. Verify with `sheets.test.tsx` cases for both, and for a search without results.
- [x] 4.2 Add the field below the heading as a GET form: search icon, the label "Search sheets", the placeholder, the count as `role="status"`, and "Clear search". Typing submits after 300 ms with `replace`; under 2 characters, or on clear, it goes to `/sheets`. Hide it without sheets. Verify with `sheets.test.tsx` cases for the count, clearing and the replaced address.
- [x] 4.3 Show the results: `<mark>` on the hit parts in the title and the artist, the matching line under the title for lyrics-only matches, on wide screens and phones, and "No sheets match “…”" in place of the list. Verify with `sheets.test.tsx` cases, and that the line is a third line on a phone, as on the canvas.
- [x] 4.4 Add the search's words to `docs/ui-text.md`: "Search sheets", "Search titles, artists and lyrics", "4 sheets" and "1 sheet", "Clear search" and "No sheets match “Königin”". Verify they match the page.
- [x] 4.5 Add e2e tests to `e2e/library.spec.ts`: find a sheet by a line of its lyrics without the umlaut, reload the search's address, go back to the sheet the library was opened from, clear the search, and search with no results on a phone. Verify they pass.

## 5. Checks

- [x] 5.1 With the `browser-check` skill, search at desktop and phone width, in light and lamplight. Verify against the design canvas.
- [x] 5.2 Run `just check`. Verify it passes.
