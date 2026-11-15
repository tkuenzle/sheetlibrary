# Design

## Context

Sheets (`routes/sheets.tsx`) and a collection (`routes/collection.tsx`) each render their own list. The shell's loader feeds the rail, and since #129 it loads again only after a form or a fetcher. Removing from a collection already uses a fetcher to the collection's action, but has no answer for an unreachable server: the fetcher's error goes to the route's error boundary, which replaces the page. Deleting a sheet today is a plain `fetch` from the editor (`sheets/delete.ts`). "Choose collections…" (`collections/choose-collections-dialog.tsx`) calls the API with plain `fetch` too.

## Goals / Non-Goals

**Goals:**
- One list component and one row menu, used by both pages.
- Row changes that keep the list on screen when the server can't be reached.

**Non-Goals:**
- Moving "Choose collections…" or the editor's delete to fetchers. That is #140.
- The sheet's own menus on Play and Edit (#134).

## Decisions

**Sorting happens in the browser, from a cookie.** The loader reads the order from a cookie (like `sheets/text-size.ts`) and passes it to the page. The page sorts the rows it has. Choosing an order writes the cookie and sorts again, with no server call, since the same rows come back in any order. Title and artist sort with the collator in `collections/collections.ts` (`sortedBy`), as a collection already does, so "Drüü" sorts with "D". Considered: `?order=` in the address, which is lost when moving through the rail unless every link carries it; sorting in SQL, which doesn't collate like the collection page does.

**Delete and remove post to the page's own action through a fetcher.** Both pages' actions handle `intent=delete`, and the collection's also `intent=remove`, as today. Sheets' action gets an intent so "New sheet" stays its default. Each page adds a `clientAction` that calls the server action and turns any failure of a row's change, an unreachable server included, into `{ ok: false }`. The row then comes back with a note, and the error boundary isn't reached. A change that answers `{ ok: false }` changed nothing, so the root, the shell and the page don't load again after it (`shell/revalidate.ts`); offline, that reload would only fail and take the frame down. After the action, React Router loads the page and the shell again, so the rail's counts follow without `revalidate()`. Considered: posting straight to `DELETE /api/sheets/:id`. A resource route can't have a `clientAction`, so offline would still reach the boundary.

**The row hides while its fetcher is pending or succeeded.** This is how `SheetRow` in `routes/collection.tsx` works now. The confirm dialog and the note live in the list, not in the row, so they survive the row going away. The focus goes to the page heading, as removing does today.

**"Choose collections…" reloads the page when it closes.** The dialog still uses plain `fetch`. When it closes after a change, the list calls `revalidate()` once, so the rail and, in a collection, the list are right. #140 will replace this.

**Data.** Each row carries `addedAt`, when the sheet came into that list. On Sheets it is when the sheet was made; in a collection, when it was added to the collection (`collection_sheet.addedAt`), so "Last added" there shows what was put in last. `readCollection` also returns `updatedAt` for its rows. `listCollections` adds a second query in the same batch for each collection's sheet titles. The titles are grouped and sorted in the worker, and the first three are kept.

## Risks / Trade-offs

- [Two sorted copies of the logic, server and browser] → The server doesn't sort for the list; only the page does, in one shared function used during server rendering too.
- [Loading every title in every collection for the cards] → A person's library is small. If it grows, a window query in SQL can take the first three.
- [One manual `revalidate()` stays, after "Choose collections…"] → Tracked in #140.
