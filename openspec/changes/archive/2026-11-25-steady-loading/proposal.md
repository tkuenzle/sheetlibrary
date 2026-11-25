# Proposal

## Why

Some skeletons don't match what they stand for, so things jump when the data arrives (#169). "Choose collections" on a sheet loads a list the page already has, and on a phone its bars often come up just as the dialog finishes growing in, so the centred dialog then changes size. The passkey skeleton's rows have no room for Rename and Remove, so on a phone each real row is about 44px taller.

## What Changes

- On a sheet's page, in play and in edit mode, "Choose collections" opens with its list and ticks, without bars.
- From a row's menu on Sheets or in a collection, the list starts loading when the menu opens. Bars show only if it hasn't arrived by the time the dialog opens.
- Every change the dialog makes, a tick and "New collection", goes through a React Router fetcher. What shows the collections loads again by itself after each change, so the dialog's `onChange` and the pages' hand-made `revalidate()` calls go. This takes the dialog's part of #140.
- On Sheets and in a collection, the rail shows the new counts after each tick, not only once the dialog closes.
- The passkey skeleton has a row for each of the account's passkeys, at the real row's height with its buttons. With no passkeys it shows "No passkeys yet".

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `site-layout`: "Choose collections" opens with what the page knows, and from a row it starts loading when the menu opens. The account page's skeleton knows how many passkeys there are.
- `play-page`: "Choose collections" opens with its list and ticks at once, on the play view and in edit mode.
- `sheet-list`: the rail follows each change made in "Choose collections", not only its close.

## Impact

- `collections/choose-collections-dialog.tsx`, a new hook for the sheet's collections, and `collections/collections-client.ts`.
- `routes/sheet.tsx`, `routes/sheet.edit.tsx`: loaders pass every collection with its tick, a `shouldRevalidate` each, and the `collectionsChanged` refs go.
- `sheets/sheet-list.tsx`: the row menu starts the load, and its `revalidate()` goes.
- `ui/menu.tsx` tells when it opens. `ui/skeleton.tsx`: bars held past their minimum now go when the data comes.
- `routes/shell.tsx` loads the passkey count. `routes/account.tsx`'s skeleton uses it. `auth/passkeys.server.ts` gets a count.
- The API's existing routes stay, and the fetchers submit to their actions.
- e2e tests for the dialog's bars and the passkey skeleton, and unit tests for the sheet's and Edit's `shouldRevalidate`.

## Open Questions

- From a row's menu, do the 200ms before bars count from the menu's opening or from the dialog's?
- On a wide screen, the collections under a sheet's title now change with each tick, behind the open dialog. Is that fine, or should they wait until it closes?
- On a phone, a long email wraps to two lines, so the account page's email row grows by about 6px when it replaces its one-line bar. The root only knows the initial, so the skeleton can't know the email's length.
