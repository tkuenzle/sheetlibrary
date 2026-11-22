# Design

## Context

The four client loaders end the same way: `fromAnotherPage(url)` decides between waiting for the data and handing it over as a promise through `holdBars()`. `PageData` renders a promise in `<Suspense>` with `PageSkeleton`, which uses `movePlays()` to show the bars at once during a move, or else after 200ms, held 400ms.

What React 19.3 does on its own, read in `react-dom`'s client build:

- A reveal is a retry commit. Before it commits, React waits for its own running view transition (`document.__reactViewTransition.finished`). Safari's own move isn't one of these.
- React has a 300ms hold for reveals (`FALLBACK_THROTTLE_MS`), but the spike showed that it doesn't apply to a new page's first reveal. See "Spike results".
- React Router renders every navigation in `startTransition`, and keeps the old page while a loader runs.

### Spike results

Measured in Chromium (desktop and phone) on the production build, with the collection's data held back:

| data held back | with a move | reduced motion |
|---|---|---|
| 50ms | no bars | no bars |
| 200ms | bars 415–497ms | bars 16–165ms on desktop, 308ms on the phone |
| 400ms | bars 360–470ms | bars 114–128ms on desktop, 321ms on the phone |

- The fast case works: the page arrives whole.
- The rows show right after the view transition has finished, never during it. With a move, that keeps the bars at least as long as the move, about 400–500ms with its captures.
- React's 300ms hold doesn't apply. With reduced motion, the transition ends after about 100–150ms, and the rows replace the bars as soon as both that and the data are done. So a page without a move can blink.
- A value the root's client middleware sets on a React Router context reaches the page's client loader.

The first load is rendered by the server, with the data whole. No client loader runs on hydration, so this change doesn't touch it.

## Goals / Non-Goals

**Goals:**
- A fast page arrives whole, with or without a move.
- No timers in components, and no check whether a move plays.

**Non-Goals:**
- The dialogs' bars (`useSkeleton`), which don't use Suspense.
- Edit and Collections, which wait for their data as today.

## Decisions

### Wait in the loader, not in the skeleton

A helper in `shell/awaited.tsx` races the data against `HEAD_START` (150ms, in `shell/slow-wait.ts`). If the data wins, the loader returns it whole. If the time wins, it returns `{ page: promise }`, as today. A failure within the wait throws as in a loader that waits, so the route's `ErrorBoundary` shows the note.

Returning the data whole, not a settled promise, keeps `PageData` out of `<Suspense>`, so React's 300ms hold never starts. During the wait, React Router keeps the old page on screen, so nothing is empty or blank.

Alternatives:
- Bars at once, no wait: a page that is ready in 50ms gets a skeleton and React's 300ms hold. After a drop (150ms), the bars stay on screen after the move ends.
- Bars unseen at first, in CSS: React's hold counts from the commit, not from when the bars become visible, so a delay of D leaves only 300 − D ms of bars. Keeping 200ms unseen and then a 400ms hold needs `holdBars` again.

`HEAD_START` stays below `SLOW_WAIT` (200ms), so the loading bar doesn't start while a page waits, and the late-cut rule doesn't apply to a fast page. A unit test checks this.

### Hold the bars from when they show

When the helper hands over the promise, it holds the data until `SKELETON_HOLD` (400ms, as for the dialogs) after the page's skeleton has shown. A layout effect in `PageData`'s fallback notes that moment (`noteSkeletonShown()`); a failure goes on at once. If no skeleton shows within 5s, the data goes on anyway, so a page can't hang.

Counting from the handover was tried first. The browser check on a throttled connection showed bars for 22ms: the page waited for its stylesheet after the handover, so the skeleton committed about 400ms late and the hold had run out. Counting from when the skeleton shows keeps one piece of module state, the moment it showed, but no timer in a component and no check whether a move plays.

Alternatives:
- Rely on React: its 300ms hold doesn't apply to a new page's first reveal (see "Spike results").
- Count from the handover: fails when the commit comes late, as above.

### The page on screen decides "another page"

`fromAnotherPage()` compares the URL with the page that `page-moves.ts` already keeps (`shown`), instead of `window.location`. On a push both are the same. On a step back, the address has already changed when the loaders run, but `shown` still names the old page. The sheet's check "from its own edit mode" uses `shown` the same way. A search, a change on a row and "Try again" keep their path, so they still wait.

### The middleware tells the loaders whether the browser moved

The root's client middleware already knows whether the browser showed its own move for this step. It puts that in a React Router context (`createContext`) before `next()`, and the helper reads it from the loader's `context`. When the browser moved, the wait is 0 and the promise goes over at once. A context is scoped to one navigation, unlike the module state in `page-moves.ts`, which a later navigation can overwrite.

### Pinned by e2e tests

That React shows the rows only after the move is an implementation detail. The e2e tests pin the behavior the spec needs: no bars for a quick page (with a move and with reduced motion); bars stay at least 400ms; a sheet's lines show only after its rise. A React upgrade that changes this fails CI.

## Risks / Trade-offs

- [A slow page starts its move 150ms later] → Accepted: it shows a skeleton anyway.
- [The first visit to a kind of page loads its code first, so the data has less than 150ms] → It falls back to the skeleton. #141 can preload the code.
- [Code and data together take over 200ms, the loading bar shows, and the page cuts with its skeleton] → Rare, and only for a slow page. The late-cut rule stays as it is.
- [A slow page's rows come up to 400ms after its bars show, even when the data is there sooner] → Accepted: only a slow page shows bars.
