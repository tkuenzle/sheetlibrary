# Design

## Context

- The root's client middleware (`pageMovesMiddleware`) already knows a step in the history (`unstable_navigationType === "POP"`) and puts "the browser moved" on a context for the loaders.
- `handOver()` in `shell/awaited.tsx` races the data against what's left of the 150ms and hands it over whole or on its way. `PageData` renders either.
- The shell has no client loader. A sheet sits outside the shell, so Back from a sheet mounts the shell again, and its collections come in a request of their own that React Router always waits for.
- The first load is rendered by the server, and no client loader runs on hydration.
- Opening a sheet changes Recent on the server (`recordOpening`, in the sheet's loader).
- Edit's Done is `navigate(-1)`. Autosave, versions, import, delete and the collection changes send plain `fetch` requests. Rows and the collection's "add" use fetchers.

### Spike results

Measured in Chromium on the production build. A collection of 30 sheets was scrolled 700px down, then a sheet opened. Every `.data` request was held back 2s, and Back pressed. The collection's client loader returned its last data on a step in the history, the shell's client loader its last collections, and the page called `revalidate()` from a passive effect:

- The collection showed with all 30 rows and no bars, about 200ms after Back (Playwright's polling). It didn't wait for the shell's request.
- The sheet dropped, and its heading moved back into its row.
- The scroll came back to 700px.
- The revalidation asked again for the shell, the collection and the root, and its commit started no view transition.

## Goals / Non-Goals

**Goals:**
- One place that keeps page data, used by the shell and the four pages.
- One request per page on Back. The background load doesn't fetch twice.

**Non-Goals:**
- Kept data on a push, such as a tap in the rail.
- Moving changes from a plain `fetch` to fetchers (#140).

## Decisions

### The page component keeps what it rendered

A small module (`shell/kept.ts`) holds a map from address (path + search) to data, at most 10 entries, the oldest dropped. The shell and each page put their data there from an effect, once they show it whole.

Alternative: keep the data in the client loader. A first load runs no client loader, so the most common case (open the app, open a sheet, go Back) would find nothing. Keeping from the component also catches a search and a load after a change.

### A step back hands over kept data from `handOver()`

The middleware puts "a step in the history" on a context next to "the browser moved". On such a step, `handOver()` looks up kept data for the address:

- Collections' shell data, a collection, the account page, a search: kept data at once, no wait.
- Sheets without a search: the usual race for up to 150ms (none after the browser's move). If the fresh data loses, it hands over the kept data with `recent` replaced by the fresh request's Recent, still on its way. Recent renders in its own `<Suspense>` with `RecentSheetsSkeleton`, and its bars are held `SKELETON_HOLD` like a page's.
- No kept data: as today.

The shell's new client loader takes its kept collections on any step in the history, and otherwise calls the server as today.

### The background load is a revalidation that reuses the request in flight

When a page shows kept data, an effect calls `revalidate()` once. React Router then runs the loaders again with the page staying on screen. It doesn't touch the navigation, so no loading bar and no "Searching…". The effect is passive, so it runs after the move.

For Sheets, the fresh request already started during the race. The keep module holds that request per address, and the revalidation's load takes it instead of fetching again.

During this load, a failure returns the kept data instead of throwing, so the page and the frame stay. Other loads fail as today.

The root sits this load out (`shouldRevalidate`). It only says who is signed in, which a step back never changes, and it has no kept data to fall back on: offline, its failure would replace the whole app with its note. Found by the "Offline Back" e2e test.

The same holds for any route that didn't show kept data, such as the shell on a step between two of its screens, where it stays on screen and its loader doesn't run. Each route's `shouldRevalidate` lets it load again in the background only when its store holds a request for it (`loadsKeptAgain()`). Found in CI, by the offline note test going Back from a collection to Sheets.

Alternative: put the fresh data in the loader's answer as a second promise and swap it in the component. That needs every page to merge two versions of its data. The revalidation goes through the path a load after a change already uses.

### A change forgets everything

- Actions and fetcher submissions: the root's client middleware forgets all kept data for any request that isn't a GET, before `next()`.
- Plain `fetch` changes: a shared `sendChange()` (in `app/changes.ts`) forgets, then calls `fetch`. The five modules use it as their default `fetch`. Their tests still pass their own.

It forgets everything rather than the pages a change touches. A sheet's title shows on Sheets, in collections and in Recent, and working that out per change is easy to get wrong. A change costs one ordinary load on the next Back.

## Risks / Trade-offs

- [A change elsewhere misses `sendChange()`, so Back shows old data] → The background load replaces it a moment later. A unit test lists the modules that call `fetch` with a method other than GET.
- [Restoring the scroll depends on the list being whole in the first commit] → An e2e test goes Back to a search scrolled far down, with the server held back.
- [Kept data in memory for 10 pages of a large library] → Lists are small JSON. One library list is the biggest entry.
- [The revalidation commit could start a view transition and make taps wait] → Spike first. If it does, render its update without the page's move class, as the move has already ended.
