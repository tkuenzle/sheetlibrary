# Proposal

## Why

Since #129, the root and the shell load their data again only after a form or a fetcher. Making, renaming and deleting a collection, and adding, renaming and removing a passkey, use a plain `fetch` and then call `revalidate()` by hand to keep the rail right. Every later change made that way has to remember it (#140).

## What Changes

- No change calls `revalidate()` by hand. A change to the person's data goes through a fetcher to its resource's route under `/api`, whichever screen it is made on. React Router then loads what's on screen again by itself.
- Making, renaming and deleting a collection go to `/api/collections` and `/api/collections/:id`. After making or deleting one, the browser moves on through a redirect from the route.
- "New collection" on Collections and in "Choose collections…" share one hook.
- Adding, renaming and removing a passkey go to a new `/api/passkeys` that runs only in the browser.
- A sheet row's "Delete" goes to `/api/sheets/:id`, "Remove from …" to the route "Choose collections…" already ticks through, and "Add sheets" to a new `POST /api/collections/:id/sheets`. The page actions lose their row changes.
- Deleting on the sheet page and in edit mode drops its `revalidate()`. Both pages sit outside the shell, so wherever a delete leads loads anyway.
- A route's `clientAction` calls the server through `serverAction()` instead of its own `fetch`, and turns a failure into `{ ok: false }`. The existing "Choose collections…" routes change the same way.
- One hook hands a fetcher's answer to a dialog's `onSave`. One helper loads the code of the routes a screen's fetchers go to.
- Out: "New sheet" stays a form. Autosave, versions and imports keep their plain `fetch`. Dialogs that follow their fetcher are #188.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. What a person sees stays the same, so the change sets `skip_specs`.

## Impact

- New routes: `routes/api.passkeys.ts`, `routes/api.collection-sheets.ts`. `clientAction`s on `api.collections.ts`, `api.collection.ts` and `api.sheet.ts`. `api.sheet-collections.ts` and `api.sheet-collection.ts` switch to `serverLoader()` and `serverAction()`.
- `collections/new-collection.tsx`, `collections/choose-collections-dialog.tsx`, `collections/add-sheets-dialog.tsx`, `collections/sheet-collections.ts`, `collections/collections-client.ts` (its browser calls go).
- `routes/collections.tsx`, `routes/collection.tsx`, `routes/account.tsx`, `routes/sheets.tsx`, `routes/sheet.tsx`, `routes/sheet.edit.tsx`.
- `sheets/sheet-list.tsx`, `sheets/row-changes.ts`, `shell/revalidate.ts` (its comment).
- The API's JSON contract and its tests stay.

## Open Questions

- "Add sheets" offline today falls to the page's error note, since the page's action only catches row changes. After this change the dialog shows its own note. Should `collection-page` spec that?
- Renaming or removing a passkey that doesn't get through shows nothing today, and still won't. Should it show a note?
