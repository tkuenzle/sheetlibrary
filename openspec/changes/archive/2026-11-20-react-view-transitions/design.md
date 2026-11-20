# Design

## Context

Today `shell/page-moves.ts` sets `data-move` on `<html>` in a layout effect, and `page-moves.css` animates the browser's `root` pictures by it. React Router starts each move when a link has `viewTransition`. With React's `<ViewTransition>`, React starts the move itself, but only for an update in a Transition, and only boundaries whose class isn't `none` take part. React Router wraps its updates in `startTransition` and gives no hook for transition types.

A spike on a throwaway branch tried the approach below in Chromium on the dev server. Every check passed except Safari's swipe back, which it couldn't test. The findings are recorded under each decision.

## Goals / Non-Goals

**Goals:**
- The same moves as today, chosen by the same `moveKind()`.
- One place picks the kind for every page change, with no prop on the links.

**Non-Goals:**
- The skeleton's timing (#168) and the skeletons that jump (#169).
- Keeping data for a step back (#163).

## Decisions

**One root client middleware picks the kind.** React Router runs the root's `clientMiddleware` on every navigation, push or step back, even when no loader runs. It knows the target's address and route pattern, but not its route ids, which React Router leaves out of a middleware's arguments, so the target's kind comes from the pattern (`patternKind()`, tested against `pageKind()` for every route). The page shown comes from a module value that a layout effect in the root sets, since on a step back the address has already changed.

```
navigation --> root clientMiddleware
  step back without the browser's own move? --> wait one task
  await next()                                  (the loaders)
  kind = moveKind(shown, target, loading bar shown or browser moved)
  kind != none --> announceMove({ from, to, kind }), wait for its render
  return
React Router renders the target --> the page's class is the kind
the move has played --> the announcement is cleared (passive effect)
```

The announcement lives in a small store read with `useSyncExternalStore`. Its updates render at once and never in a Transition, so React doesn't move for them. The page's `<ViewTransition>` takes the kind only in the render whose address is the announced target (`pageMoveClass`); every other commit gets `none`. The titles take their shared class while a rise or a drop is announced, so the leaving title, which React reads from its last render, has it too. Once the page has changed and the move has played, a passive effect clears the announcement, so a later Suspense reveal neither moves the page nor pairs the skeleton's heading with the real one. A move is late when the loading bar has shown (`noteLoadingBar` from `<PageLoading />`), which is what the spec says.

Considered:
- **Transition types through a pending async action** (`addTransitionType`), which the first version used. React queues types on the root, and whichever Transition commits next takes them. On a slow CPU or a heavy page, React Router's render of the wait often committed first: the old page moved over itself and the new page came without a move (19 of 40 rises with the CPU slowed 4x). That failed CI.
- **A wrapper around links and `navigate()`** that adds the type at the tap. Steps back would need their own path, and the kind would need the target's page before the loaders run.

**A step back waits one task.** React renders an update made during `popstate` at once, with no move. React Router finishes a step back within the microtasks of that event when no loader waits on the network, which is the usual case. So the middleware waits one task (`setTimeout(0)`) first. After the browser's own move (`hasUAVisualTransition`, read in a capture `popstate` listener set up when the module loads) it doesn't wait, so React renders at once and the browser's picture matches. In the spike, the Back arrow, the browser's Back and Forward, and Done all moved with the wait. The spike didn't run them without it; React's source says they would cut.

**Steps back and navigations from React Router's fields.** The middleware reads `unstable_initiator` to skip fetchers and revalidations, which also run middleware, and `unstable_navigationType` for a step back. Nothing stable tells a fetcher apart. The e2e tests cover both, so a change in React Router shows up as a failing test, not a silent cut.

**One `<ViewTransition>` around the pages.** In the root: `<ViewTransition default="none" update={{ fade, rise, drop, mode }}>` around a `<div>` that holds the `<Outlet>`. That `<div>` is the one picture of the page, as `root` is today, rail included, so the shell still stays still in a fade and a sheet still rises over it. The spike needed three more things:
- `:root { view-transition-name: none }`, because React still captured the root.
- `animation: none` on the page's group. Its box changes size between pages, and the browser animated `width` and `height`.
- The page background and `min-height: 100dvh` on the `<div>`, or its picture is see-through.

`page-moves.css` keeps its rules, now on `::view-transition-*(.rise)` and the other classes.

**The title shares a name per list.** A row's title and the sheet's heading sit in a named `<ViewTransition>`. React fails when two mounted boundaries share a name, and Recent and the list can show the same sheet, so the names are `title-list-<id>` and `title-recent-<id>`. The heading takes the name of the list in the location's state (`openedFrom`), or none. Its `share` class is `none` except while a rise or a drop is announced.

**The title's move swaps the browser's keyframes.** In `onShare`, the browser's group animation holds the old box and the new box. The handler reads them, then replaces that animation's keyframes with `translate` and `scale` (`titleMoveStart()` as today) and its timing with `--motion-long` and `--ease-move`. A new `animate()` on the group instead failed to run off the main thread in a `blink.animations` trace (code 4). Swapping the keyframes passed, the same way React drops unchanged width and height. The title's two pictures also get the token durations, so with reduced motion nothing fades.

**Whether a move plays.** `movePlays()` asks whether a view transition runs while a move is announced, instead of reading `data-move`.

## Risks / Trade-offs

- [React changes how it spots `popstate`] → Back would cut again, silently. An e2e test checks that Back drops.
- [The unstable fields change] → The e2e tests for a fetcher and for a step back fail.
- [Each move waits for one more render before its commit, and a step back for one more task] → A few milliseconds. On a long list, the rows' titles render again to take their shared class.
- [React shares no element outside the window] → The title doesn't move to or from a row that is scrolled away, such as a Recent card off screen on a phone. The page still moves.
- [Moves that didn't move before] → "New sheet", an import, and creating or deleting a collection now move (see specs). The kinds are the same as for a link.
