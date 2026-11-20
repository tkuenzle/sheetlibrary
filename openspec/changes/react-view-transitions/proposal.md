# Proposal

## Why

React Router 8.5 deprecates its own view transition APIs, which our page moves (#162) are built on, in favour of React's `<ViewTransition>`. React's moves also know about Suspense: React waits for a running move to end before it reveals a page's data. The skeleton work that comes next (#168, #169) builds on that, so the moves change first.

## What Changes

- Page moves run through React's `<ViewTransition>`. They look and feel as they do now: peers fade, a sheet rises, Back drops it, Edit is a mode, the shell stays still, and the title turns into the heading.
- Back keeps its move, by the arrow and by the browser, as do Forward and Done. React renders an update made during the browser's `popstate` at once, without a move, so a step in the history waits one task before it loads. After the browser's own move, such as Safari's swipe back, it doesn't wait, and the page changes at once.
- Every change between two pages moves by its kind, not only links that ask. So "New sheet" and an imported sheet now rise, and creating or deleting a collection fades. A search, the key or the capo changes only the address and stays still.
- Data that arrives while the page moves in now shows when the move ends. Before, it swapped in mid-move.
- The title still moves only by `translate` and `scale`, so every move runs off the main thread.
- A stack change: `react-router` and `@react-router/dev` to 8.5 or later. React 19.3.1 is already enough.
- `docs/motion.md` says how moves work with React.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `site-layout`: every change between two pages moves by its kind, and a page's data that arrives mid-move shows when the move ends.

## Impact

- `root.tsx`: a `<ViewTransition>` around the pages, and a client middleware that picks the move's kind.
- `shell/page-moves.ts` and `page-moves.css`: the kind becomes a transition type instead of `data-move` on `<html>`. The title moves through a named `<ViewTransition>` and `onShare`. The `ViewTransitionContext` from React Router goes.
- `shell/awaited.tsx`: whether a move plays comes from the running transition's types.
- The `viewTransition` prop and option go from the rail, the bottom bar, the rows, Recent, Collections, Edit and `sheets/sheet-moves.ts`.
- `sheets/sheet-list.tsx`, `sheets/recent-sheets.tsx`, `routes/sheet.tsx`: the title's name moves to `<ViewTransition>`.
- `e2e/page-moves.spec.ts` reads the move's types instead of `data-move`. Some loading and waiting e2e tests change too.
- `docs/motion.md`.

## Open Questions

- Safari's swipe back wasn't checked on a device. In theory the page changes at once with no second move, but it needs an iPhone.
- How long a tap takes to start a move in a production build wasn't measured. The step back adds one task, and every move adds another before the commit.
- While a move plays, do taps still land on its pictures (motion.md's "Taps wait")? The root isn't captured any more, so they may reach the page below.
- On a step back with slow data, Sheets waits for its data and then cuts, because `fromAnotherPage()` already sees the new address. That's on main today too. Should it be its own issue?
- Browsers that have view transitions but not their types: do they move with the wrong kind, or not at all?
