# Design

## Context

The API routes under `/api` hand each request to a plain handler (`collections/collections-api.server.ts`, `sheets/sheets-api.server.ts`) that reads a JSON body and answers with a status: 409 for a name already used, 404 for something not the person's. A body must say it is JSON. That check is what stops a form on another site from making a change.

Since #169, "Choose collections…" sends its changes through fetchers to two of those routes. Their `clientLoader` and `clientAction` call the same address again with `fetch`, and turn a failure into `{ ok: false }`. `useCollectionsRoutes()` loads the two routes' code as soon as a page that can open the dialog shows, because a fetcher whose route code can't load makes React Router reload the page.

The sheet list's rows post to their page's action with an intent (`sheets/row-changes.ts`). The root's client middleware forgets the pages kept for Back on every fetcher submission. The root and the shell load again after any submission that didn't answer `{ ok: false }` (`shell/revalidate.ts`).

## Goals / Non-Goals

**Goals:**
- One way to make a change from any screen, which React Router follows by loading again.

**Non-Goals:**
- Changing the API's JSON contract.
- Dialogs that follow their fetcher's state (#188).
- Loading the code of pages ahead of time (#141).

## Decisions

### Fetchers go to the resource's route, not the page's

Each change goes to the route of what it changes, under `/api`, from whichever screen. The same change starts from several screens: deleting a sheet from the list, a collection, the play view and edit mode, and "New collection" from Collections and "Choose collections…".

Alternative: each page's own action with an intent, as rows do today. The page's code is already there, so it needs no preloading. But one change ends up in several actions, and they grow into mixed lists (`collection.tsx` already holds deleting a sheet, adding sheets and taking one out). Rejected.

### Fetchers send JSON, and the handlers stay

Fetchers submit with `encType: "application/json"`, so the handlers and their tests stay as they are, apart from the `code` below, and so does the JSON check. The play view's delete keeps its plain `fetch` to the same handler.

Alternative: actions that read form data and answer `data()`, as discussed in explore. It drops the JSON check, so protection would rest on the SameSite cookie alone, and it changes the API's contract for its tests. Rejected.

### A `clientAction` wraps `serverAction()`

Each route a fetcher changes through has a `clientAction` that calls `serverAction()`, not its own `fetch`. It turns the server's answer into `{ ok: true }`, `{ ok: false, refused }` for a name already used, or `{ ok: false }` for anything else, including a server it can't reach. Where the screen moves on, the `clientAction` answers with the redirect: `/collections/:id` after making a collection on Collections, `/collections` after deleting one. The handlers never redirect, so the API stays an API. The two "Choose collections…" routes change the same way, their `clientLoader` with `serverLoader()`.

`serverAction()` hands over the body, not the status: React Router keeps the status for itself. So an error body also says what went wrong in a `code`, such as `{ error: "Name is already used", code: "taken" }`, and the `clientAction` reads `error` and `code`. The statuses stay, so a plain `fetch` reads the API as before.

Alternatives: call the address with `sendChange`, as #169 does, which reads the status but makes two hops. Or compare the `error` text, which breaks quietly when the wording changes. Rejected.

### Passkeys go to a route that runs only in the browser

`/api/passkeys` has only a `clientAction`. It reads the change from a JSON body (add, rename or remove) and calls the auth client, since a passkey is made in the browser. The shell's passkey count and the account page load again by themselves. The note when adding fails stays.

Spike first: React Router accepts a route module with only a `clientAction`. If it doesn't, the account page gets that `clientAction` instead.

### Rows

A row's "Delete" submits `DELETE` to `/api/sheets/:id`. "Remove from …" submits `DELETE` to `/api/sheets/:id/collections/:collectionId`, the same change as unticking in "Choose collections…". "Add sheets" submits the ticked ids to a new `POST /api/collections/:id/sheets`, which adds them in one write with `addSheets()`. The rows' fetcher keys stay, so a row still goes at once and comes back on `{ ok: false }`. The row knows which change it sent, so it picks its note without the answer saying it.

The page actions lose their row changes. `collection.tsx` loses its action and `clientAction`. `sheets.tsx` keeps only "New sheet". `keepListOnFailure` and `rowAnswer` go.

### One hook from a fetcher to `onSave`

`NameDialog` and `ConfirmDialog` wait for an async `onSave`, but `fetcher.submit()` resolves without the answer. One hook, grown from `useNewCollection`, submits and settles with the answer: it resolves on `{ ok: true }`, throws `NameRefused` on `refused`, and throws an `Error` on `{ ok: false }`. It also resolves when the fetcher goes idle with no answer, which is what a redirect leaves. #188 replaces it.

### One helper loads the routes' code

`useCollectionsRoutes()` takes the route ids to load, and each screen names the routes its fetchers go to. Every submission waits for the code. When it can't load, the change answers `{ ok: false }`. This is a slice of #141, which can take it over.

### Deleting a sheet on its page loads nothing by hand

The play view and edit mode sit outside the shell. After a delete they step back or open Sheets, and every page that can lead to is a new match or has new params, so it loads anyway. Kept pages were forgotten by `sendChange`. The `revalidate()` after the move only loads everything a second time, so it goes.

## Risks / Trade-offs

- [A screen that forgets to load its routes' code works online and reloads the page offline.] → An e2e case per screen makes a change offline and checks that the note shows and the page stays.
- [A dialog whose change redirects waits on a promise that never gets an answer.] → The hook resolves when the fetcher goes idle without one.
- [The helper reads React Router's manifest through an `UNSAFE_` export.] → Same as #169. The offline e2e cases catch a change in its shape.
