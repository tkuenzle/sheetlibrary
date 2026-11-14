# Design

## Context

No route exports an `ErrorBoundary`, so any error in a loader or a render ends in React Router's default page. `sheets/search-field.tsx` already has the one pending sign: `useSearchPending` shows "Searching…" after 200ms.

Which loaders run on a move decides where a failure lands. With single fetch, React Router 8.4 asks every route on screen to load again on each move (`singleFetchLoaderNavigationStrategy` calls `shouldCallHandler(true)`), unless its `shouldRevalidate` says no. So the root and the shell load again on every move, and all loaders of a move are fetched in one request. Offline, they all fail together, and the error goes to the highest boundary: the root's, without the rail.

The collections change in four ways. Adding and removing sheets are fetchers, and "Rename" calls `revalidate()`; both load every route again. Making and deleting a collection call the API with a plain `fetch` and then navigate.

## Goals / Non-Goals

**Goals:**
- A failed move in the shell breaks only the screen, so the rail stays.
- A failed search breaks nothing but the results.

**Non-Goals:**
- Fetchers (removing a sheet from a collection, adding sheets, choosing collections). They keep their own notes; #137 makes them show their result at once.
- Links that still load in full: the sheet's top bar and the Play/Edit switch, until #134.
- Telling a reader that a page is loading. Focus already moves to the new page's heading once it shows.

## Decisions

### The bar reads the navigation, in the root

The root renders the bar above everything. It shows when `useNavigation().state` isn't `"idle"` for 200ms, so a form that submits, such as "New sheet", shows it too. A navigation to the same path where only the search changes, without a form method, is a search and doesn't count. The 200ms delay moves out of `useSearchPending` into a shared hook that both use.

The bar is fixed at the top of the window, 3px high, above the rail. It is decorative (`aria-hidden`). With motion, a short segment slides across it; with reduced motion, the whole bar shows in the accent without moving. The duration is a plain value until #89 brings motion tokens.

Alternative: the bar over the content column only, so the rail stays still. Dropped: the rail and the content share one background, so the two looked the same on the canvas, and one bar in the root is simpler.

### Error boundaries at three levels

- Each screen in the shell (`sheets`, `collections`, `collection`, `account`) exports an `ErrorBoundary` that renders the error view. The shell around it stays.
- The shell exports one too. It catches its own loader's failure, when the shell is entered from outside, and renders `ShellView` with no collections and the error view inside. "Sheets", "Collections" and the account still work.
- `sheet.tsx` and `sheet.edit.tsx` export one that renders the top bar and the error view.
- The root exports a last resort: the site's name and the error view, without the shell.

The error view is one component in `ui/`: an icon, an `h1`, a line and "Try again". The heading takes focus through the existing `useFocusOnNavigation`, since the address has changed.

### Telling "can't reach" from "something went wrong"

An error is "can't reach" when it is a `TypeError` from a failed fetch, or when `navigator.onLine` is false. Anything else, such as a 500, is "something went wrong". A missing sheet or collection renders in place with a 404 status and never throws, so it doesn't reach a boundary.

An address that matches no other route gets a catch-all route, `routes/not-found.tsx`, which answers 404 and shows "Page not found". Alternative: the root's boundary. Rejected: React Router doesn't run the root's loader for an address that matches nothing, so the page couldn't tell who is signed in and pick the link. The root's boundary still shows "Page not found" for a 404 that reaches it, with the link to the home page.

### "Try again" loads the address again

"Try again" navigates to the current address with `replace`. Loading the same address runs every loader again, the root's and the shell's included, so it also recovers from a failure in either. The root's boundary does a full reload instead, since it shows when the app itself may be broken.

### The root and the shell keep their data on plain moves

Both get one `shouldRevalidate` rule, in `shell/revalidate.ts`: load again after a form or a fetcher, and when the same address loads again (which covers `revalidate()` and "Try again"); keep the data on any other move, a search included. Who is signed in only changes with a full load (signing out loads the home page). Making and deleting a collection call `revalidate()` after they navigate, so the rail follows.

A failed move then fails only the new screen, whose boundary sits inside the shell. Each move also stops reading the session and the collections again.

Alternative: keep loading the shell on every move, with a `clientLoader` that falls back to the last collections offline. Rejected: a second mechanism to cover the first one's failures, and its cache is empty until the first move.

### A failed search is caught on Sheets

`sheets.tsx` gets a `clientLoader` that calls `serverLoader()` and, when that fails because the server can't be reached, returns `{ failed: true }` instead of throwing. `LibraryView` keeps the last list it showed. With `failed`, it keeps showing that list and the note below the field. With no list to keep, as when Sheets is opened offline with a search in the address, it throws, and the screen's boundary takes over.

Alternative: load the results with a fetcher, outside the navigation. Rejected: the search lives in the address, and the history and focus rules are built on that.

## Risks / Trade-offs

- [The exact error a failed single fetch throws offline isn't documented] → An e2e test with Playwright's `setOffline` pins it down, for a move and for a search.
- [A `clientLoader` on Sheets changes how its data loads] → It doesn't run on the first load (no `hydrate`), so the server-rendered page is unchanged. The existing search tests cover the rest.
- [A move that fails after 200ms shows the bar, then the error] → Expected: the bar shows that something is happening, and the error replaces the screen when the request fails.
- [Offline, a kind of page whose code hasn't loaded this session can't be opened: React Router can't fetch its route or its module, and either the root's boundary shows, without the rail, or it reloads the page into the browser's offline page (`loadRouteModule`)] → Accepted for now: losing the connection while using the app is the common case, and pages already visited show the note inside the frame. An issue loads the main pages' code ahead of time.
- [A later change to the collections made with a plain `fetch` could forget `revalidate()`, and the rail would be stale] → The rule's comment says so, and the e2e tests check that the rail lists a new collection and drops a deleted one. An issue moves these changes to fetchers, which load again on their own.
