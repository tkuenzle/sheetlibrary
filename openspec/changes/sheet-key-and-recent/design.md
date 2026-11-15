# Design

## Context

The app already works out a sheet's key in the editor and the play view: the set key, or else `guessKey` over the chords (`editor/sheet-title.tsx`). The list never reads content; it reads columns beside it, as it does for `lyrics` (migration 0005). `sheet_version.key` already stores a key as text such as "F#m" (`readVersionKey`). Migrations are SQL only, applied by wrangler and, for previews, by `db/migrations.server.ts`.

## Decisions

### The key is a column on `sheet`, written on create and save

`chordsheet` gets a function that gives a sheet's key as text, "F#m" or "Bb", or nothing when the sheet has no chords. `sheets.server.ts` writes it into a new `key` column on create and on save, next to `lyrics`. The list, search and a collection's sheets return it.

Existing sheets are not filled in. A sheet without a key is a normal state anyway (no chords), and there are almost no sheets yet. An existing sheet gets its key on its next save.

Alternatives: fill the guessed keys on read, the first time the list meets a sheet without one (a lasting exception to "the list never reads content"), or a one-off script (has to be run by hand on each database). SQL alone can copy a set key but can't guess one.

### Openings go in their own table, one row per person and sheet

`sheet_open("userId", "sheetId", "openedAt")`, primary key `("userId", "sheetId")`, each a foreign key with `on delete cascade`. An opening upserts the row (`insert … on conflict do update`), so the table never holds more than one row per person and sheet.

Why not a column on `sheet`: opening is something a person does. Once sheets can be shared (#36), one column would mix everyone's openings. Why not a log of every opening: it grows without end, Recent would need the latest per sheet, and no feature needs the history.

### The sheet page's loader records the opening

`routes/sheet.tsx`'s loader upserts after it has found the person's sheet, in the same request, so there is no extra round trip and it works before hydration. It runs again when the page reloads its data (a version, a capo, a change on the page), which only sets the time again. A failed write is ignored, so the sheet still opens. The editor's loader writes nothing. The rows don't prefetch, so hovering a row doesn't count.

Alternative: a fetcher from the page after it hydrates. More code, an extra request, and nothing gained here.

### Sheets reads the recent sheets in its loader

Without a search, the Sheets loader also reads the 4 latest rows of `sheet_open`, joined to `sheet` on the person's own sheets, with title, artist and key. While searching it doesn't read them. Returning from a sheet loads Sheets again, so the row is up to date.

## Risks / Trade-offs

- [Existing sheets show no key until they are saved] → Accepted; there are few. A later script can fill them if needed.
- [A database write on every opening of the play view] → One small upsert on a row that already exists; failures don't block the page.
- [The key column and the content can drift if a save path forgets the key] → Write it in the one place that writes `lyrics`, and test create, save and import together.

## Migration Plan

One migration, `0007_sheet_key_and_opens.sql`: add `key` (text, empty allowed) to `sheet`, and create `sheet_open` with its index on `("userId", "openedAt")`. No data is copied. Rolling back the code leaves an unused column and table, which is harmless.
