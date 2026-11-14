# Proposal

## Why

Since the shell (#131), moves inside the app happen without a full load, so the browser no longer shows that a page is loading. On a slow connection a click looks like nothing happened. Offline, a failed move shows React Router's "Unexpected Application Error" in place of the app, because no route has an error boundary. This is step 2 of the UX overhaul (#129), and the later steps build on it.

## What Changes

- One thin bar across the top of the window shows that a page is loading. It is the same on every page and shows only after 200ms, so fast pages don't flicker. With reduced motion it doesn't slide.
- The bar is for the whole page. A wait in one place keeps its own sign there: a search keeps "Searching…" and gets no bar, and the dialogs keep their loading text.
- When a page can't be loaded, the error shows inside the frame. In the shell, the navigation stays. On a sheet, the top bar stays. The content says "Can’t reach Sheet Library" when the server can't be reached, or "Something went wrong" otherwise, with a "Try again" button that loads the same address again.
- A search that doesn't go through keeps the last results, and says "Couldn’t search. Showing the last results." The page and what was typed stay.
- An address that matches no page shows "Page not found", with a link to the sheets or the home page, in place of React Router's default page.
- The bar and the error view go on `/design` with the other base components.
- Not in this change: skeletons, and actions such as removing a sheet from a collection showing their result at once (#137); a shared motion concept (#89); the sheet's links that still load in full (#134). The editor's save state stays as it is.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `site-layout`: the loading bar, errors shown inside the frame with "Try again", and the page for an address that matches no page.
- `library-search`: a search that doesn't go through keeps the last results and says so.

## Impact

- `root.tsx`: the bar and a last-resort error boundary. The root and the shell no longer load their data again on every move, only after a change. A catch-all route, `routes/not-found.tsx`, shows "Page not found".
- An error boundary on the shell, on each screen inside it (`sheets.tsx`, `collections.tsx`, `collection.tsx`, `account.tsx`) and on the sheet's pages (`sheet.tsx`, `sheet.edit.tsx`).
- `routes/collections.tsx` and `routes/collection.tsx`: making and deleting a collection tell the router, so the rail follows.
- `routes/sheets.tsx` and `sheets/search-field.tsx`: a failed search; the 200ms delay is shared with the bar.
- `apps/web/app/ui/`: the bar, the error view and two new icons, `cloud_off` and `refresh`. `routes/design.tsx` shows the bar and the error view.
- Tests: unit tests for the bar, the error view and the failed search; an e2e test that goes offline.
- `docs/ui-text.md` and `docs/design-direction.md`. The line in `design-direction.md` saying the boards draw search on every screen is already corrected; the canvas now draws it below the heading of Sheets.
- Design: the "UX overhaul" page of the canvas, row "Waiting and offline". https://claude.ai/artifact/DcmNjZGDmLtgu7mwb8jyi5
