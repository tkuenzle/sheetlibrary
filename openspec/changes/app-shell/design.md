# Design

## Context

`routes.ts` is a flat list. Each page renders its own `TopBar` and `<main>`, and `/sheets` and `/collections` share a `LibraryTabs` component. Every link is a plain `<a href>`. `Form` and `navigate` already move without a full load, after "New sheet", an import, and making or deleting a collection.

Three things in the code shape the approach:

- React Router 8 with SSR runs every matched loader again on each move without a full load, unless a route opts out.
- `sheet.edit.tsx` and `editor.tsx` ask before unsaved edits are lost through `beforeunload`. That only fires on a full load. `top-bar.tsx` keeps plain links for this reason.
- Layout is decided by CSS, not by scripts, so the server renders the right layout and nothing jumps (`docs/design-direction.md`).

## Goals / Non-Goals

**Goals:**
- One place that owns the navigation, the search row and the content area, so #129, #136 and #137 can add to it without moving things.
- The rail's list of collections is never out of date.

**Non-Goals:**
- Moving the sheet pages into the shell, or changing their top bar. That is #134.
- A sign that a page is loading (#129), and any transition (#136).

## Decisions

### A layout route without a path

`routes.ts` wraps `/sheets`, `/collections`, `/collections/:id` and `/account` in `layout("routes/shell.tsx", […])`. The addresses stay as they are. `/sheets/:id` and `/sheets/:id/edit` stay outside, as siblings.

The shell renders the skip link, the navigation, the search row and one `<main>` with the `<Outlet />`. The four routes drop their `TopBar` and their own `<main>`. A collection that isn't found renders only its heading and text there; `NotFound` keeps its top bar for a sheet.

### The shell's loader lists the collections

The loader sends a visitor who isn't signed in to `/sign-in` and returns `listCollections`, one small query. Since every matched loader runs again on each move, the rail is right after "New collection" and "Delete", which call the API and then navigate. "Rename" already calls `revalidate()`.

The loader opts out with `shouldRevalidate` when only the search of the address changes, so typing a search doesn't run the query on every pause.

`/collections` reads the same list from the shell's loader and has no query of its own, so the rail and the page can't disagree.

Alternative: load the rail's list in the browser with a fetcher. Rejected: the rail would be empty on the first paint and jump when the list arrives.

### Two navigation components, picked by CSS

`ui/nav-rail.tsx` and `ui/nav-bar.tsx` are base components that take their items. The rail has a compact form with icons only, set by a prop. The shell renders three navigations: the rail, the compact rail and the bar. CSS shows one: the bar up to 640px, the compact rail up to 1023px, the rail above. The hidden ones are `display: none`, so they are out of the tab order and of what screen readers read. `/design` shows all three at one width.

Alternative: one `<nav>` restyled at each width. Rejected: the three forms hold different things (the collections, the site's name, the account) and mark a collection differently, so each needs its own markup. The design page couldn't show them side by side either.

Alternative, tried first: one rail whose compact form is picked by a media query. Dropped while building: the compact form marks "Collections" for an open collection and has tooltips, which is markup, not style.

The account's initial is in the rail, and a second time in the search row, shown only on phones.

New icons: `library_music` for Sheets and `stacks` for Collections, as on the boards.

### A layout that doesn't move

The shell is a grid with fixed tracks: the rail is 272px wide, or 80px in its compact form, and the search row and the bottom bar have fixed heights. The content column keeps the library's 880px, and the account page its 640px, centred. The document scrolls, not the content area, so `ScrollRestoration` keeps working and a phone's browser bars still hide. The rail is sticky at the full height of the window, and only its list of collections scrolls. The bottom bar is fixed. Its height is a CSS variable that the docked buttons and the content's bottom padding use.

### The search field belongs to the shell

`SearchField` moves from `LibraryView` into the search row. It reads `q` and the count from the Sheets route's loader data when that route is matched, and is empty elsewhere. After a move to another screen it follows the address again, even while it has the focus, so going back from a search empties it. From another screen, the first navigation adds to the history, with a state that says to keep the focus; on `/sheets`, updates replace, as today.

The field can't stay in the Sheets route: it would be torn down when a search opens Sheets from another screen, and lose the focus in the middle of a word.

### Which links move without a full load

`<Link>` and `<NavLink>` are used for the navigation, the rows of the three lists and "Add passkey". `TopBar` keeps `<a href>`, so leaving the editor still fires `beforeunload`. `TopBar` loses the `accountPage` prop and the link form of `back`, which have no user left.

Alternative: `useBlocker` in the editor, and `<Link>` everywhere. Left for #134, which rebuilds the sheet's bar anyway.

### Focus after a move

A hook in `root.tsx` runs when the path changes, not on the first load and not when only the search changes. It focuses the `h1` inside `<main>` with `preventScroll`, and gives it `tabIndex={-1}` if it has none. It does nothing when focus is already inside `<main>`, which covers the new sheet's title field, or when the navigation's state says to keep the focus, which covers the search. It lives in the root so that a sheet opened from a row is covered too.

The skip link targets the shell's `<main>`, which gets `tabIndex={-1}`.

## Risks / Trade-offs

- The shell's loader runs on every move inside the shell → it is one grouped query, and it is skipped while searching.
- Three navigations are in the DOM → the hidden ones are `display: none`. Unit tests don't apply CSS, so they test each one on its own.
- Going from a sheet back to the library is still a full load, so the shell is built again → accepted until #134.
- Moves no longer show the browser's loading sign → #129 follows directly.
- `e2e` tests look for the "Library" heading and the navigation named "Library" → they are rewritten with the shell, not after it.
