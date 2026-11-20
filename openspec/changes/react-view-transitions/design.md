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

**One root client middleware picks the kind.** React Router runs the root's `clientMiddleware` on every navigation, push or step back, even when no loader runs. It knows the target address. The page shown comes from a module value that a layout effect in the root sets, since on a step back the address has already changed.

```
navigation --> root clientMiddleware
  step back without the browser's own move? --> wait one task
  await next()                                  (the loaders)
  kind = moveKind(shown, target, late or browser moved)
  kind != none --> startTransition(async () => {
                     addTransitionType(kind)
                     await nextTask()
                   })
  return
React Router: startTransition(setState) --> joins the pending action --> gets the type
```

React keeps the types of a pending async action and adds them to every Transition that finishes while the action runs. React Router calls its `startTransition` in the microtasks after the middleware returns, so the action, which waits one task, is still pending then. Adding the type after `next()` lets the middleware know whether the data came late (`isLate`), as today. A navigation that isn't a page change starts no action and moves nothing.

Considered:
- **A wrapper around links and `navigate()`** that adds the type at the tap. Steps back would need their own path, and the kind would need the target's page before the loaders run.
- **A class chosen during render** on the `<ViewTransition>`. It stays until the next render, so a later Suspense reveal would play the move again. Types last for one commit only.

**A step back waits one task.** React renders an update made during `popstate` at once, with no move. React Router finishes a step back within the microtasks of that event when no loader waits on the network, which is the usual case. So the middleware waits one task (`setTimeout(0)`) first. After the browser's own move (`hasUAVisualTransition`, read in a capture `popstate` listener set up when the module loads) it doesn't wait, so React renders at once and the browser's picture matches. In the spike, the Back arrow, the browser's Back and Forward, and Done all moved with the wait. The spike didn't run them without it; React's source says they would cut.

**Steps back and navigations from React Router's fields.** The middleware reads `unstable_initiator` to skip fetchers and revalidations, which also run middleware, and `unstable_navigationType` for a step back. Nothing stable tells a fetcher apart. The e2e tests cover both, so a change in React Router shows up as a failing test, not a silent cut.

**One `<ViewTransition>` around the pages.** In the root: `<ViewTransition default="none" update={{ fade, rise, drop, mode }}>` around a `<div>` that holds the `<Outlet>`. That `<div>` is the one picture of the page, as `root` is today, rail included, so the shell still stays still in a fade and a sheet still rises over it. The spike needed three more things:
- `:root { view-transition-name: none }`, because React still captured the root.
- `animation: none` on the page's group. Its box changes size between pages, and the browser animated `width` and `height`.
- The page background and `min-height: 100dvh` on the `<div>`, or its picture is see-through.

`page-moves.css` keeps its rules, now on `::view-transition-*(.rise)` and the other classes.

**The title shares a name per list.** A row's title and the sheet's heading sit in a named `<ViewTransition>`. React fails when two mounted boundaries share a name, and Recent and the list can show the same sheet, so the names are `title-list-<id>` and `title-recent-<id>`. The heading takes the name of the list in the location's state (`openedFrom`), or none. Its `share` class is `none` except for rise and drop.

**The title's move swaps the browser's keyframes.** In `onShare`, the browser's group animation holds the old box and the new box. The handler reads them, then replaces that animation's keyframes with `translate` and `scale` (`titleMoveStart()` as today) and its timing with `--motion-long` and `--ease-move`. A new `animate()` on the group instead failed to run off the main thread in a `blink.animations` trace (code 4). Swapping the keyframes passed, the same way React drops unchanged width and height. The title's two pictures also get the token durations, so with reduced motion nothing fades.

**Whether a move plays.** `movePlays()` reads `document.activeViewTransition.types` instead of `data-move`. React passes the types to the browser's `startViewTransition`.

## Risks / Trade-offs

- [React changes how it spots `popstate`] → Back would cut again, silently. An e2e test checks that Back drops.
- [The unstable fields change] → The e2e tests for a fetcher and for a step back fail.
- [Each move waits one more task before its commit, and a step back two] → A few milliseconds. The production build is measured in the tasks.
- [Moves that didn't move before] → "New sheet", an import, and creating or deleting a collection now move (see specs). The kinds are the same as for a link.
