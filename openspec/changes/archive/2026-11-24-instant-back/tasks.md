# Tasks

## 1. Spike

- [x] 1.1 In the scratchpad, make the collection's client loader return the last data on a step back and call `revalidate()` from a passive effect; in Chromium, verify the drop and the title move play, the scroll comes back, and the revalidation commit starts no view transition; record the result in design.md
- [x] 1.2 In the same spike, give the shell a client loader that returns its last collections on a step back; verify with the collections held back 2s that Back from a sheet no longer waits for them; adjust design.md if it does

## 2. Keeping data

- [x] 2.1 Add `shell/kept.ts`: keep, look up and forget data by path + search, at most 10 entries, plus the fresh request in flight per address; verify with unit tests for the limit, a search kept apart from the list, and forget
- [x] 2.2 Make the root's client middleware put "a step in the history" on a context, and forget all kept data for any request that isn't a GET; verify with tests in `page-moves.test.ts`
- [x] 2.3 Add `sendChange()` in `app/changes.ts` and make it the default `fetch` of `sheets/autosave.ts`, `sheets/versions.ts`, `sheets/import.ts`, `sheets/delete.ts` and `collections/collections-client.ts`; verify with a unit test that it forgets, and one that no other module calls `fetch` with a method other than GET

## 3. Back to a page as it was left

- [x] 3.1 Keep the data the shell, a collection, the account page and Sheets show, from an effect once it is whole; verify with the e2e tests in 3.4 and 3.5, which only pass with kept data (the unit tests have no DOM, so effects don't run there)
- [x] 3.2 Add the kept-data branch to `handOver()` for a step in the history, and the shell's client loader; verify with unit tests for a kept page, no kept data, and a step after a change
- [x] 3.3 Load again in the background with `revalidate()` after kept data shows, reusing the request in flight, and return the kept data when that load fails; verify with unit tests for the reuse and the failure
- [x] 3.4 Add e2e tests for "Back to a slow collection", "Slow collections", "Offline Back" and "A renamed sheet"; verify they pass, and that the old "Back to a slow list" e2e test now edits the sheet first
- [x] 3.5 Add an e2e test that goes Back to a search scrolled far down with the server held back 2s; verify the rows and the scroll come back at once

## 4. Back to Sheets

- [x] 4.1 Make Recent's cards one height in `sheets/recent-sheets.css`, with room for two title lines, the artist and the key, and the skeleton's cards the same; verify with an e2e test that measures cards with and without artist and key, and the bars
- [x] 4.2 Let Sheets take Recent on its way: render it in its own `<Suspense>` with `RecentSheetsSkeleton`, its bars held `SKELETON_HOLD`; verify with a component test
- [x] 4.3 In `handOver()`, for Sheets without a search, race the fresh data for up to 150ms (none after the browser's move) and fall back to the kept list with Recent on its way; verify with unit tests for both outcomes
- [x] 4.4 Add e2e tests for "Back to Sheets when slow" and "Back to a quick list"; verify "Swiping back to a slow list" shows the rows with bars only in Recent

## 5. Docs and check

- [x] 5.1 Describe Back with kept data in `docs/motion.md` and the comments in `shell/awaited.tsx` and the loaders; verify none still says a step back always loads from the server
- [x] 5.2 Run the whole e2e suite, `pnpm lint` and the unit tests; verify all pass
- [x] 5.3 Check in the browser with the `browser-check` skill: Back to Sheets, a search and a collection, on a fast and a throttled connection; verify nothing blinks or jumps

## Workflow follow-up

- Ask in the PR for the Safari check on an iPhone: swiping back to a slow list and a slow collection.
- Take Recent's height out of #169, and open an issue for kept data on a push.
- Archive the change after review.
