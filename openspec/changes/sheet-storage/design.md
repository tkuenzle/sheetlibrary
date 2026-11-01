# Design

## Context

Accounts already live in D1 (`DB`), in production and in a separate preview database, with migrations in `apps/web/migrations/`. The root middleware puts the session in `sessionContext` for every route. `workers/app.ts` sends `/api/auth/*` to Better Auth and everything else to React Router. The editor reads its sheet once and reports only whether it differs from that sheet (`onEditedChange`). `handBack()` turns its draft into a checked `ChordSheet`.

## Decisions

**D1, not KV or a Durable Object.** D1 is already bound and migrated everywhere, and a sheet can reference its owner in `user`. A stale save is refused with one conditional `UPDATE`, without a lock. KV has no compare-and-set. A Durable Object only pays off for live co-editing, which can load the stored JSON into Yjs later.

**One `sheet` table, with the details in their own columns.** Columns: `id` (primary key), `userId` (references `user`, `on delete cascade`, so #69 cleans up), `revision`, `title`, `artist`, `content` (the format's JSON as text), `createdAt`, `updatedAt`. An index on `(userId, updatedAt)` serves #51's list. Title and artist sit outside `content`, so the list never parses content. The other choice, the whole envelope as one JSON column, would need `json_extract` for every list.

**A save is one conditional update.** `UPDATE sheet SET … revision = revision + 1 WHERE id = ? AND userId = ? AND revision = ?`. One changed row means saved, and the response returns the new revision. No changed row means a refusal. A second `SELECT` on `id` and `userId` then tells "stale" (409) from "not found" (404). Both answers refuse, so a race between the two statements can't store anything wrong.

**The API is a React Router resource route.** `/api/sheets` takes `POST` to create. `/api/sheets/:id` takes `GET`, `PUT` and `DELETE`. Both send and receive JSON. Resource routes go through the root middleware, so they get the session without a second lookup in `workers/app.ts`. A missing session answers 401. Ids are made on the server with `newSheetId()`. Request bodies are checked with `checkEnvelope` after a size check on the raw body (256 KB), and they answer 400 on failure. The database code sits in one server module that the page's loader and the API share.

**The page loads through its loader and saves with plain `fetch`.** The `/sheets/:id` loader reads the sheet from D1 directly. Saves call `PUT /api/sheets/:id` with `fetch`, not a fetcher, because a fetcher action would revalidate the loader after each save and reload the sheet under the editor.

**The save loop is a small state machine in the page.**

```
 saved --edit--> waiting --1s quiet--> saving --200--> saved (or waiting, if edited meanwhile)
                    ^                    |
                    +----- edit ---------+
 saving --network/5xx--> failed --backoff (2s .. 30s)--> saving
 saving --409--> conflict (read-only, stops for good)
```

Only one save is in flight at a time. Each save sends the latest `handBack()` result and the last revision the server confirmed. An edit made during a save waits for that save, then goes out on the new revision. The leave prompt is on in every state except `saved`.

**The editor gains two small props.** `onChange` is called after every change to the document, and the page uses it to start the timer. `readOnly` switches ProseMirror's `editable` off and hides the chord input and section toolbar. `/editor` uses neither.

## Risks / Trade-offs

- [Workers Free allows 10 ms of CPU per request, and a save parses and checks the whole sheet.] → Chord sheets are a few KB. Check the CPU time in the dashboard after the first real use.
- [D1's free tier limits rows written per day.] → One write per save, at most about one a second while typing. Fine for an invite-only site.
- [Closing the tab within a second of an edit loses it if the person ignores the prompt.] → The leave prompt covers it. A `keepalive` save on `pagehide` can come later if it's needed.
- [Nothing in the UI creates a sheet yet.] → Tests create sheets through the API. #51 adds the way in.

## Migration Plan

1. Add `0003_sheets.sql`. The deploy job applies it before deploying, and previews apply it themselves.
2. Rollback: revert the pull request. The empty table stays, which is harmless.
