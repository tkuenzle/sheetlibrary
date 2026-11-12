# Proposal

## Why

The library is one list, newest edit first. With many sheets, finding a song is slow, and people often remember a line of a song rather than its title (#33). Albums and sets (#34, #35) will also need a way to find a sheet.

## What Changes

- A search field below the library's heading finds sheets by title, artist and lyrics. Results update as you type, after a short pause. The search is in the address, as `/sheets?q=…`, and each update replaces it, so Back leaves the library.
- A search starts at 2 characters. Shorter, the library lists all sheets as today.
- Words match from their start, and case and accents don't matter: "konige" finds "Drüü Könige".
- Results are ordered by how well they match. A match in the title counts most, then the artist, then the lyrics.
- Matches are marked in the title and the artist. A sheet that matches only by its lyrics shows the line with the match under its title.
- The field says how many sheets match, such as "4 sheets", and has a button to clear it. When nothing matches, the list gives way to "No sheets match “Königin”".
- The library may now use the lyrics as plain text, given by the sheet's format. It still never reads the content itself.
- Not in this change: finding sheets for albums or sets, and searching chords or section labels.

## Capabilities

### New Capabilities

- `library-search`: finding one's sheets by title, artist and lyrics: the field, how words match, the order of results, the marks and the matching line, and no results.

### Modified Capabilities

- `library-page`: the list shows all sheets, newest edit first, only while there is no search.
- `sheet-envelope`: library features may use the plain text a format gives, besides the envelope's fields.
- `chord-sheet-model`: the model gives a sheet's lyrics as plain text.

## Impact

- `apps/web/migrations/`: a lyrics column on `sheet`, filled for existing sheets, and a full-text index (SQLite FTS5) kept up to date by triggers.
- `apps/web/app/db/migrations.server.ts`: splitting a migration must keep a trigger's body whole.
- `apps/web/app/sheets/sheets.server.ts`: creating and saving a sheet writes its lyrics; a search query.
- `packages/chordsheet`: the lyrics as plain text.
- `apps/web/app/routes/sheets.tsx` and `sheets.css`: the field, the results, the marks, the matching line and no results.
- `apps/web/e2e/library.spec.ts`: searching on a wide screen and a phone.
- `docs/ui-text.md`: the field's label and placeholder, the count, "Clear search" and no results.
- `wrangler d1 export` can't export a database with an FTS5 table. Nothing uses it today.
- The design canvas: https://claude.ai/artifact/CfCvVgRudJH6GBu6sx5Xj3

## Open Questions

- Should results update as you type, as planned, or only on Enter?
- Should the field stay at the top of a phone screen while scrolling? As planned, it scrolls away.
- Should the no-results card keep the mockup's help line, "Search looks in titles, artists and lyrics.", and its "Clear search" button?
- Each word is found on its own, anywhere in the sheet, so "grace newton" finds "Amazing Grace" by John Newton. Should quotes search for words side by side?
- "ß" and "ss" don't find each other. Is that fine?
