# Design

## Context

The library's loader reads every sheet of the person with `listSheets` (`sheets.server.ts`): id, title, artist and last edit, never the content. Title and artist are columns beside the content (`migrations/0003_sheets.sql`). The lyrics are only inside the content's JSON.

Migrations are SQL files. The preview applies them through `applyMigrations` (`db/migrations.server.ts`), whose `statements()` splits a file on `;`. Tests run against a real local D1 (`db/local-env.test-helper.ts`).

The UX is on the design canvas: https://claude.ai/artifact/CfCvVgRudJH6GBu6sx5Xj3

## Goals / Non-Goals

**Goals:**
- The library never reads a sheet's content; the format gives the lyrics.
- The index can never hold the text of a sheet that is gone, also when an account is deleted.
- The search works before the scripts load: Enter submits the field.

**Non-Goals:**
- Paging the results or the library.
- A search API apart from the library's loader.

## Decisions

### A lyrics column, written by the app

`sheet` gets a `lyrics` column. `createSheet` and `saveSheet` write it from a new `chordsheet` function, `plainLines(content)`, which gives the line texts as `spec chord-sheet-model` says.

Alternatives:
- Work out the lyrics in SQL, in a view the index reads, with `json_tree` over the content. Nothing extra is stored, but SQL would then know the chord sheet's JSON, and a second format (M11) would need its own SQL. Rejected.
- A normalized search column (lowercase, no accents) with `LIKE`. It needs our own accent folding and our own mapping from a match back to the original text for the marks. Rejected for FTS5, which does both.

### An FTS5 index on `sheet`, kept by triggers

```sql
create virtual table "sheet_fts" using fts5("title", "artist", "lyrics",
  content='sheet', content_rowid='rowid', tokenize='unicode61 remove_diacritics 2');
```

It is an external-content table: it holds only the index and reads the text from `sheet`. Three triggers keep it in step: after insert, after delete, and after an update of `title`, `artist` or `lyrics`. The delete and update triggers pass the old values, which an external-content table needs to remove them.

Triggers, not writes from the app, because a sheet also goes when its owner is deleted (`on delete cascade`), and no app code runs then. A row left in the index could match a later sheet that gets the same rowid and show another person's lyrics. A spike with SQLite showed that the cascade fires the delete trigger.

Alternatives:
- A regular FTS5 table. It keeps a second copy of the text. Rejected.
- Filling the index lazily on the first search. It writes during a read and races between tabs. Not needed, since the migration can fill everything.

### The migration fills everything

`0005_library_search.sql`:
1. adds `lyrics` (`text not null default ''`),
2. fills it for existing sheets with `json_tree(content, '$.sections')`, joining the values with the key `text`, in order, with line breaks,
3. creates `sheet_fts` and the triggers,
4. runs `insert into sheet_fts(sheet_fts) values('rebuild')`.

Step 2 copies the version 1 layout of the content into SQL once. From then on, `plainLines` writes the column. A test checks that both give the same lyrics for the same sheet.

`statements()` must keep a `create trigger … begin … end` whole, though its body holds `;`.

### The query

The loader searches when `q`, trimmed, has 2 characters or more. Each word becomes a quoted prefix, `"grac"*`. Quotes inside a word are dropped, and a word without a letter or a digit is left out. The words are joined with spaces, so each must match, anywhere in the sheet. No typed character is ever FTS5 syntax.

```sql
select s.id, s.title, s.artist, s.updatedAt,
       highlight(sheet_fts, 0, char(57344), char(57345)),
       highlight(sheet_fts, 1, char(57344), char(57345)),
       highlight(sheet_fts, 2, char(57344), char(57345))
from sheet_fts join sheet s on s.rowid = sheet_fts.rowid
where sheet_fts match ? and s.userId = ?
order by bm25(sheet_fts, 20, 5, 1)
```

`bm25` with weights, not fixed tiers of title, artist and lyrics. Within each column, a stronger match comes first, and words found in several columns add up. In a small library a common word gets almost no weight, so ties are close. Title 20 over lyrics 1 keeps a title match first in practice. The weights are one constant, to be tuned on real songs.

### Marks and the matching line

`highlight()` wraps each matched word in U+E000 and U+E001, two private-use characters. The server turns the text into parts, `{ text, hit }`, and never sends HTML; the row renders a hit as `<mark>`. A whole word is marked, also when only its start was typed.

For a sheet without a mark in its title or artist, the server finds the first line of the highlighted lyrics with a mark. It sends only that line, cut to start a few words before the first match with "…" when the match is far in. CSS cuts the end with an ellipsis.

### The field

The field is a GET `<Form>` with `q`, so Enter works without the scripts. With them, typing submits after a 300 ms pause, with `replace` and `preventScrollReset`. Under 2 characters, it goes to `/sheets` without `q`. "Clear search" does the same and keeps the focus in the field. The count ("4 sheets") is a `role="status"` element inside the field.

While a navigation to `/sheets` is loading (`useNavigation`) for more than 200 ms, the count reads "Searching…", and the list or the no-results card gets `aria-busy` and is dimmed. The delay keeps a fast answer from flickering. React Router cancels a navigation when a newer one starts, so results never arrive out of order. A failed search is #129's, with the rest of the app.

The loader also says whether the person has any sheets, so a search without results still shows the field, and the "No sheets yet" page doesn't.

## Risks / Trade-offs

- `wrangler d1 export` refuses a database with a virtual table → nothing uses it; D1 Time Travel restores. For a dump: drop `sheet_fts`, export, create it again and `rebuild`.
- `wrangler d1 migrations apply` might split the trigger bodies as our runner did → apply the migration locally with wrangler as the first task, before building on it.
- A title or line holding U+E000 or U+E001 would show a wrong mark → harmless; `plainLines` drops them.
- The index matches all people's sheets before the `userId` filter → fine at this size. Later, add `userId` to the index.
- "ß" doesn't find "ss", and the other way round → listed in the proposal's Open Questions.

## Migration Plan

The migration and the code ship together. Old code would save without `lyrics`, leaving it stale until the next save. To roll back, drop the triggers and `sheet_fts`; the column can stay.
