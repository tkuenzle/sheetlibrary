# Proposal

## Why

A page shows all at once when its data is there. Until then the old page stays, and after 200ms the loading bar shows. Since #162, a page that came late changes without a move, so on a slow connection pages never move. This is step 9 of the UX overhaul (#137).

## What Changes

- On a move inside the app, the new page shows right after the tap, with a skeleton where its data will be. The move plays with the skeleton, and the rows fill in when they arrive.
- The skeleton is the real page: the frame, the heading, and whatever the browser already knows. Data still on its way shows as bars inside the real row's frame, at the real row's height, so nothing shifts when it arrives.
- What the browser already knows shows for real: a collection's name and count from the rail, so the skeleton has that many rows, up to a screenful; a sheet's title and artist from the row it was opened from. The account page's email is a bar like the rest of its data, since the root loader only passes the initial.
- Skeletons on Sheets, a collection, a sheet and the account page, and in the lists of "Add sheets" and "Choose collections". A dialog's bars show only after 200ms and then stay at least 400ms, so they never flash. Collections already has all its data and shows at once.
- The data shows as soon as it arrives, also while the page is still moving in. On a fast connection that is mostly before the page shows at all.
- A page that loads again on its own, such as after a row's delete or during a search, keeps what it shows. No skeleton.
- A first load comes full from the server, with no skeleton.
- The bars are a new part of the design system. They pulse in opacity, and stand still with reduced motion.
- Edit keeps waiting as it does today, and so keeps the cut after a long wait.
- `docs/motion.md` says how skeletons fit with moves.
- Design: the "Loading" row on the UX overhaul page of the design canvas.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `site-layout`: pages and the loading dialogs show a skeleton while their data loads; a long wait now cuts only where there is no skeleton.
- `design-system`: skeleton bars, and they stand still with reduced motion.

## Impact

- Loaders of `routes/sheets.tsx`, `routes/collection.tsx`, `routes/sheet.tsx` and `routes/account.tsx`: their client loaders hand over the data without waiting for it.
- The pages render their data inside `<Suspense>` and `<Await>`, with a skeleton as the fallback.
- `sheets/sheet-list.tsx`, `sheets/recent-sheets.tsx`: the row's link also passes the title and the artist.
- `collections/add-sheets-dialog.tsx`, `collections/choose-collections-dialog.tsx`: bars in the list while it loads.
- New `ui/skeleton.tsx` and its CSS.
- `docs/motion.md`.
- e2e tests with a slow connection, with and without reduced motion.

## Open Questions

- Edit: should it get a skeleton, or use what Play just loaded, instead of waiting?
- Recent shows in the skeleton, then goes away for a library that turns out to have none. Is that fine?
- How fast do the bars pulse? Repeating signs have no motion token yet.
- Rows that arrive while the page moves in replace the bars in the middle of the move. Does that look like a flicker on a phone? If it does, they could wait for the move to end.
- On a slow connection the rows arrive after the move. Do they replace the bars at once, or fade in?
- A sheet opened from somewhere without a row, such as a collection's link on a sheet, has no title to show. Is a bar in the heading fine there?
- Deleting from the sheet's menu still waits in the confirm dialog. Should it go back to the list at once, and bring the row back with a note if the server says no?
- Changes to collections (new, rename, delete) still wait. Leave them to #140?
