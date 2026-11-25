# Design

## Context

"Choose collections" loads its list with a plain `fetch` each time it opens and saves with plain `fetch` (`collections/collections-client.ts`). Its three hosts, the sheet's page, Edit and the sheet list, each keep a `collectionsChanged` ref and call `revalidate()` when it closes. The sheet's loader already reads every collection with its tick (`sheetCollections`), then keeps only the ticked ones for the chips. Edit's loader reads none.

The root and the shell load again after a form or a fetcher, and not after a plain move (`shell/revalidate.ts`). A fetcher submission also forgets the pages kept for Back, through the root's client middleware (`shell/kept.ts`).

## Goals / Non-Goals

**Goals:**
- One source for a sheet's collections that the dialog and the chips share, and that loads again by itself after a change.

**Non-Goals:**
- The rest of #140: the rail's "New collection", renaming and deleting a collection, and passkey changes.

## Decisions

### The collections are a keyed fetcher

A hook, such as `useSheetCollections(sheetId, initial?)`, wraps `useFetcher({ key: "collections:" + sheetId })` over `GET /api/sheets/:id/collections`. Until the fetcher has data, it answers with `initial`, what the page already knows.

- The sheet's loader passes every collection with its tick. The chips filter the ticked ones from the hook. Edit's loader reads `sheetCollections()` too.
- A row's menu calls `fetcher.load()` on opening. The dialog, opened later, reads the same key, so it finds the list there or still on its way.
- React Router loads a fetcher that has data again after each submission, so the list follows every tick.

Alternative: let each tick reload the page's loaders and read the list from them. It re-reads the sheet and its versions, records an opening for Recent on every tick, and reloads the sheet under the editor. Rejected.

### The dialog's changes are fetchers to the existing API routes

A tick submits `PUT` or `DELETE` to `/api/sheets/:id/collections/:collectionId`. "New collection" submits `POST` to `/api/sheets/:id/collections`. Each tick gets its own fetcher, keyed by the collection, so the box shows the pending tick from the fetcher's method until the answer comes. The `onChange` prop, the `collectionsChanged` refs and the three `revalidate()` calls go.

Alternative: post to each host page's own action with an intent, as a row's delete does (`sheets/row-changes.ts`). It works today, but it needs an action branch in four routes, two of which have no action. Kept as the fallback (see Risks).

### Failures answer, not throw

A fetcher whose request can't reach the server throws to the page's error boundary. The dialog shows its own notes today, and the sheet must stay. So the two API routes gain a `clientLoader` and `clientAction` that call the server and turn a failure into an answer:
- `{ ok: false }` for a change, which `changedNothing()` already treats as "load nothing again". The tick goes back with "The change couldn’t be saved. Try again."
- A failed answer for the list, which shows "The collections couldn’t be loaded. Close this and try again."
- A 409 from `POST` comes back as an answer too. `fetcher.submit()` resolves without the answer, so `onSave` waits for the fetcher to settle, reads its data and throws `NameRefused` with the same note as today.

### The routes' code loads ahead, and fetchers wait for it

A fetcher needs its route's code. If that code can't load, React Router reloads the page, and offline the browser then shows nothing. Before this change the dialog used plain `fetch`, so it showed its note offline. So `useCollectionsRoutes()` imports the two routes' modules from React Router's manifest (`UNSAFE_FrameworkContext`) as soon as a page that can open the dialog shows. Route modules are split, so that means each route's main, client-loader and client-action chunks. React Router's own import of the same address later needs no network. Every load and change waits for that import first. If it fails, the list shows its failed note, a tick goes back with its note, and the next try imports again.

Alternatives: post to each host page's action (the fallback above), or wait for #141 to preload route code in general. This is a narrow slice of #141, which can take it over.

### The sheet and Edit don't reload on a tick

Their `shouldRevalidate` returns false when `formAction` is one of the sheet-collections routes. The root still reloads. Back to the shell then reloads it anyway, since kept pages were forgotten.

### The shell loads the passkey count

`hasPasskey()` becomes `countPasskeys()`, or a count beside it, and the shell's loader reads it with the collections in parallel. The shell loads again only after a change, so this adds one small query per shell load. The account page's skeleton reads it through `useRouteLoaderData`, as `useShellCollections()` does. Passkey changes still call `revalidator.revalidate()` until #140, which reloads the shell too.

## Risks / Trade-offs

- [It reads React Router's manifest through an `UNSAFE_` export, whose shape can change in an update.] → The e2e cases offline catch it: opening a row's menu offline, and a first tick offline on a sheet.
- [The chips under a sheet's title change behind the open dialog on each tick.] → Listed in the proposal's Open Questions.
- [A row menu that opens and closes without picking loads the list for nothing.] → It's one small request, and it keeps the dialog steady.
- [`useSkeleton` kept its bars for good when they had shown longer than their 400ms hold before the data came: its cleanup read a ref that still said "loading".] → The ref now follows in a layout effect, which runs before that cleanup. Found when the row's early load made such waits likely.
