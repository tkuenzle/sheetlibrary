# Design

## Context

`sheets.server.ts` creates, reads, saves and deletes a person's sheets in D1. The `sheet` table keeps `title`, `artist` and `updatedAt` in their own columns, with an index on `(userId, updatedAt)`, so a list needs no content. The root middleware puts the session in `sessionContext`, and the root loader passes `signedIn` to `SignedInContext`, which `TopBar` reads. `/sheets/:id` already opens a stored sheet, and an empty content (`sections: []`) is valid: the editor shows one empty section for it.

The look was designed on the canvas's "Library and account" page: <https://claude.ai/artifact/DcmNjZGDmLtgu7mwb8jyi5>. The boards for this change are "Library, desktop", "Library, phone" and "Library, empty (first sign-in)". Other boards on that page belong to #76 to #79.

## Goals / Non-Goals

**Non-Goals:**

- Paging or search. An invite-only library stays small enough for one list.
- The account initial that the boards show in the top bar. It comes with #79; until then the top bar keeps its "Account" link.
- "Import" in the library, which the boards also show (#78).

## Decisions

**The page follows the boards.**

- A narrow column (about 880px) on the tinted page. The heading "Library" at title size, with a filled "New sheet" button (icon `add`) beside it on wider screens.
- Rows are a grouped list: white rows (`--surface-active`) 2px apart, 4px inner corners, and only the top corners of the first row and the bottom corners of the last row round at `--corner-medium`. No other cards or borders.
- Wide: one row per sheet, with title (bold), artist and last edit in columns, and small muted column labels above. Phone: title on the first line, then "Artist · Today" muted below.
- On a phone, "New sheet" is the large button (`button-large`) at the bottom right, like the docked "Chord" button, so the top bar holds only the name and the account link.
- The whole row is one link. No menu on rows.
- Empty: a white card with "No sheets yet" and "New sheet". The board's line about importing waits for #78.

**"New sheet" is a form that posts to the library's own action.** The action creates `{ title: "Untitled", content: { format: "chordsheet", version: 1, sections: [] } }` with `createSheet` and redirects to `/sheets/:id`. A plain `<Form method="post">` works before the scripts load and needs no client code. Calling `POST /api/sheets` with `fetch` would also work, but needs JS and a navigation after it. A form on another site can't use the action: Better Auth's session cookie is `SameSite=Lax`, so a cross-site POST arrives without a session and the action answers like the loader, with a redirect to `/sign-in`.

**The list reads only what the rows show.** A `listSheets(db, userId)` in `sheets.server.ts` selects `id`, `title`, `artist` and `updatedAt`, ordered by `updatedAt` descending. It never parses `content`.

**The last edit is formatted in the browser.** The loader sends `updatedAt` as milliseconds. "Today" and "Yesterday" depend on the viewer's time zone, which the server doesn't know. The server's HTML holds the date in UTC but hides it, so it keeps its place; after hydration, the row shows the viewer's local "Today", "Yesterday" or date. A wrong day never shows. The format is fixed English ("28 Oct", "3 Sep 2025"), not the browser's locale, to match the rest of the UI.

**Redirects live in loaders.** `/` gets a loader that redirects signed-in people to `/sheets`. `/sheets` redirects visitors to `/sign-in`, like `/sheets/:id` and `/account`.

**Sign-in lands in the library.** The email link's `callbackURL` becomes `/sheets`, and the sign-in loader sends signed-in people to `/sheets` instead of `/account`. A passkey sign-in already goes to `/`, which now redirects on. The `?welcome` offer comes out of the account page instead of staying as code nothing reaches; #80 designs a prompt for the library and can reuse the words. The e2e sign-in (`e2e/auth.setup.ts`) passes its own `callbackURL` and keeps working.

**The top bar's name follows `SignedInContext`.** `TopBar` links the name to `/sheets` when `signedIn` is true and to `/` otherwise. Outside the app's routes (tests), where the context is undefined, it stays `/`.

## Risks / Trade-offs

- [A new sheet can't be renamed until #76.] → #76 is next in M4. Untitled sheets can be deleted with #77 or renamed once #76 lands.
- [The last edit shows a moment after the rest of the page, and not at all without JavaScript.] → The editor needs JavaScript anyway. The layout keeps its place.
