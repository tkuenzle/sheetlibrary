# Proposal

## Why

Going back loads the page's data from the server again. A slow answer shows the page with bars, and if the shell's own request is slow too, Back waits for it and then cuts without a move. On an iPhone, the sheet shows again for a moment after Safari's swipe ends. Back should show the page as it was left, right away (#163).

## What Changes

- The app keeps the data that Sheets, a search on Sheets, Collections, a collection and the account page last showed, and the shell's collections. It keeps them in memory for the last 10 addresses. The sheet page keeps nothing.
- A step back in the history to a collection, Collections, the account page or a search shows the kept data at once. The page then loads again in the background, as after a change, and fresh data replaces the kept data when it arrives.
- Back to Sheets without a search is different, because opening a sheet changes Recent. It waits up to 150ms for the fresh page, as today. If the fresh page comes later, or after Safari's swipe, Sheets shows its kept list at once, with bars only in Recent.
- On a step back, the shell always takes its kept collections, so Back no longer waits for its separate request.
- Any change to the person's data forgets all kept data. A step back after a change works as it does today.
- When the background load fails, offline too, the page keeps what it shows.
- Recent's cards get one height, so its bars and its cards take the same room. This point moves here from #169.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `site-layout`: a step back shows kept data at once and loads again in the background. Back to Sheets falls back to the kept list with bars in Recent. A change forgets kept data.
- `library-page`: Recent's cards have one height, as a requirement of its own.

## Impact

- `shell/awaited.tsx`: another branch in `handOver()` for kept data. A new module keeps the data.
- The client loaders in `routes/sheets.tsx`, `routes/collection.tsx` and `routes/account.tsx`. A new client loader for `routes/shell.tsx`. Collections reads the shell's data.
- `root.tsx`: the client middleware forgets kept data after an action or a fetcher.
- One shared helper for changes sent with a plain `fetch`: `sheets/autosave.ts`, `sheets/versions.ts`, `sheets/import.ts`, `sheets/delete.ts`, `collections/collections-client.ts`.
- `routes/sheets.tsx`: Recent can come later than the list. `sheets/recent-sheets.css`: one card height.
- e2e tests for Back, and `docs/motion.md`.

## Open Questions

- The first sheet a person ever opens: the kept Sheets has no Recent. When the fresh page is slow, should Back show Recent's bars, or no Recent until it arrives (the list then moves down)?
- Should the kept data have an age limit, or is the background load enough?
- A change made in another tab or on another device: the kept data shows until the background load replaces it. Is that fine?
- Showing kept data on a tap in the rail too, not only on Back: park as its own issue.
- The title opened from Recent has no card to move back into while Recent shows bars, so the sheet just drops. Fine?
