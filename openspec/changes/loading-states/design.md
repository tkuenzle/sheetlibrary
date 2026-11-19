# Design

## Context

The pages' server loaders read D1 in the same worker, so they are fast. On a move, the slow part is the round trip from the browser. React Router starts the move once the new page's loaders are done, and `shell/page-moves.ts` cuts the move when that took longer than `SLOW_WAIT`. Collections has no loader of its own; it uses the shell's data, which the shell keeps on a move. Sheets already has a `clientLoader` that keeps the last results when a search can't reach the server. The two dialogs load on their own: "Add sheets" through a fetcher to the Sheets loader, "Choose collections" with a plain `fetch` and "Loading collections…".

## Goals / Non-Goals

**Goals:**
- No timers in the pages: the skeleton gives way when the data is there and the move has ended.
- The server loaders stay as they are.

**Non-Goals:**
- Edit, the home page and sign-in.
- Keeping data for a step back (#163). Its kept data can later go through the same client loaders.
- Changes that wait for the server (sheet menu's delete, collections). See the proposal's open questions and #140.

## Decisions

**The split happens in the client loader, not on the server.** Each page's `clientLoader` returns the server loader's promise without awaiting it, next to what it knows at once. So the move starts right after the tap. Considered: a server loader that streams a fast part and a slow part. Both parts still need the round trip, so the first frame would wait just as long. The client loaders don't run on the first load (no `hydrate`), so a first load stays full from the server.

**What the first frame knows comes from the browser.**

```
page          known at once                         from
a collection  name, count                           the shell's loader data
a sheet       title, artist                         the row's link state
account       its headings and buttons; the email   -
              is a bar (see below)
Sheets        nothing beyond the heading            -
```

The root loader passes only the account's initial, since its data is on every page, so the account page's email is a bar while the passkeys load, as its other data.

`openedFrom()` in `shell/page-moves.ts` grows to carry the title and artist next to the list's name. Without that state, the heading is a bar too. A collection's skeleton draws `min(count, 8)` rows. Its `meta()` takes the name from the shell's match, since the loader data is a promise.

**`<Suspense>` and `<Await>`, and the data waits for the move.** Each page renders its data in `<Await>`, with the skeleton as the `<Suspense>` fallback. The promise the client loader hands over is `afterMove(serverLoader())` (`shell/awaited.tsx`): once the data has arrived, it waits for the animations on the `::view-transition` pseudo-elements to finish, if any are running. So rows that arrive while the page moves in come in as the move ends. Without a move, as when a page loads again or with reduced motion, nothing waits. Data that arrives before the move's animations have started goes into the new picture, so the page moves in whole.

The plan was to let React hold the skeleton: React 19 doesn't swap a fallback for its content until about 300ms after it appeared (`FALLBACK_THROTTLE_MS`). The spike showed it doesn't for this update. With the data held back 50ms, the rows were in the page before the fade had started. With `afterMove`, data held back 250ms left the skeleton exactly as the move finished, and data held back 50ms joined the page within a few milliseconds of the fade's start, while the new picture is still transparent. Considered: a timer that shows the skeleton only after 200ms. The browser takes the new page's picture at the tap, so the page would move in empty. Considered: waiting a fixed `--motion-long` after the tap. It would also hold the rows back when no move plays.

**Only a move from another page hands over a promise.** A search, a reload after a change on a row, and "Try again" load the page that is open. Its client loader waits for them as before (`fromAnotherPage` in `shell/awaited.tsx`: the address still names the open page while the loaders run). So the page keeps what it shows, and React Router's navigation stays "loading" until the data is there, which a search's "Searching…" reads. The spike had shown that React keeps the shown rows for a new promise too, but "Searching…" would have gone at once. A dialog's fetcher that loads the library's list asks for the list itself with `?list` (`LIST_ONLY`), since a fetcher's load runs the client loader too and looks like a move.

**A first load renders without `<Suspense>`.** React's server sends a large `<Suspense>` apart, after its fallback, even when its content is ready: Sheets with a long list showed its bars on a first load before the rows. `PageData` (`shell/awaited.tsx`) renders `<Suspense>` and `<Await>` only when the data came as a promise, and the data directly when it came whole. It keeps that choice while the page stays, so its parts keep their state as it loads again. It is keyed by the collection or sheet, so a move to another one shows its skeleton, never the last one's rows.

**The focus follows the heading.** After a move, the focus goes to the page's heading, which is the skeleton's. When the data arrives, that heading gives way to the page's own, so the skeleton's heading hands the focus on as it leaves (`useFocusCarriesOver` in `shell/focus.ts`). The skeleton's search field on Sheets works, and hands what was typed in it, and its focus, to the page's own field the same way.

**Failures still reach the frame.** Sheets keeps its "keep the last results" rule inside the promise: a search that can't reach the server resolves to `{ failed }`. Other rejections reach `<Await>`'s `errorElement`, which throws them on to the route's `ErrorBoundary`, so the note shows inside the frame as before. A redirect (signed out, a sheet's version that is gone) rejects the promise with a response; the error element follows it with a `replace` navigate. A sheet or collection that isn't there resolves to its 404 data and shows "not found" in place.

**One skeleton part.** `ui/skeleton.tsx` draws a bar: a block with rounded ends in `--quiet`, or the soft accent for chords and keys, sized by the text it stands for and placed inside the real row's markup, so the row keeps its height. The pulse animates `opacity` only and has its own reduced-motion rule, like the loading bar. The dialogs use the same bars: "Add sheets" while its fetcher has no data yet, "Choose collections" in place of "Loading collections…".

**The cut after a long wait stays as a guard.** With the promise handed over, the move's wait is near zero, so `isLate` rarely fires. It still covers pages without a skeleton, such as Edit.

## Risks / Trade-offs

- [Data that arrives after the move has started but before its animations exist swaps in at the fade's first frames] → The new picture is still transparent then. An e2e test with data held back 250ms checks that the skeleton stays until the move ends.
- [The skeleton's frame differs from the real page and things jump] → Bars sit in the real row markup. Checked against the "Loading" boards on the design canvas, and in the browser with a slow connection.
- [A redirect inside the promise shows the skeleton for a moment first] → Rare (expired session, a version that is gone). Acceptable.
- [Recent shows bars and then disappears for a library without recent sheets] → Rare; listed as an open question in the proposal.
