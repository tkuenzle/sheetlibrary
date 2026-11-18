# Design

## Context

The shell's screens are children of `routes/shell.tsx`. A sheet's play view (`/sheets/:id`) and edit mode (`/sheets/:id/edit`) are routes of their own, outside the shell. So on the frame a sheet appears, the shell is already gone, and plain CSS on the new page can't raise the sheet over it.

Moves come from `<Link>`s (rail, bar at the bottom, Collections, the sheet rows, recent sheets, "Edit") and from `useSheetMoves().go()`: Back, Done and leaving after a delete. These step back in the history or open an address. Edit mode holds a move until the sheet is saved, then makes it again with `navigate()`. React Router's `viewTransition` calls `document.startViewTransition` once the new page's data is there, and remembers which pairs of addresses had one. A step back between the same two addresses plays one again.

## Goals / Non-Goals

**Goals:**
- One place decides how a move looks; links only ask for a move.
- Moves that change only the address of the same screen, such as a search, a key or a capo, stay instant.

**Non-Goals:**
- Overlays (#160) and loading states (#137).
- Sliding between the sheets of a set (#154).

## Decisions

**React Router's `viewTransition`, asked for by each link and move.** The browser takes a picture of the old page, so the sheet can rise over it although the shell has left the page. React Router replays it on the browser's back. Considered: React's `<ViewTransition>`, but React Router runs every update as a transition, so typing a search would animate unless it was turned off everywhere. Considered: putting the sheet under the shell's layout and animating by hand. That changes the routes and needs hand-written animation code for the title.

**The kind of move follows from the two pages.** The root keeps the last page's kind (shell screen, play, edit) and, when the page changes, sets `data-move` on `<html>`: `fade` between shell screens, `rise` from the shell to a sheet, `drop` from a sheet to the shell, `mode` between play and edit of one sheet. It sets it in a layout effect. React Router renders the new page inside the browser's update callback, and the browser only styles the move's pseudo-elements after that, so the CSS sees the new value. Considered: the direction in the history. React Router only reports "POP" for back and forward alike, and a link from a sheet to a collection is a push that should drop.

**The CSS animates the root's two pictures.**

```
fade   old root fades out, new root fades in (300ms)
rise   old root stays; new root rises a little and fades in (300ms, enter curve)
drop   old root drops a little and fades out, above the new root (150ms, exit curve); new root stays
mode   old root fades into the new root (150ms)
```

The rail and the bar at the bottom get no name of their own. In a fade, their pixels are the same in both pictures, and the browser blends the pictures so that same pixels stay solid, so they look still. A named rail would be painted above the root and cover a rising sheet. All durations and curves are the motion tokens, so with reduced motion the move takes 0s and needs no rule of its own.

**The title moves through a shared name.** A row's title and the sheet's heading get `view-transition-name: sheet-title` while React Router says their sheet is in the move (`useViewTransitionState`). The browser moves the title between the two places. A name must be on one element per page, or the browser skips the whole move. Recent sheets and the list on `/sheets` can show the same sheet, so the row's link puts its list in the location's state, and only the row in that list takes the name, going in and coming back.

**Moves made in code ask too.** `useSheetMoves().go()` passes `viewTransition` when it opens an address. A step back plays the move React Router remembered. Edit mode's held move, made again after saving, goes through the same path.

**The browser's own move wins.** A `popstate` listener reads `hasUAVisualTransition`. When the browser already showed a move, as Safari does after a swipe from the edge, the root sets `data-move="none"`, and the CSS gives the pictures no animation. The new page shows at once, after the browser's swipe.

## Risks / Trade-offs

- [Safari may not report `hasUAVisualTransition` on `popstate`] → A spike in Safari on an iPhone comes first. Without it, look for another sign of a swipe, or turn off the move on back in Safari.
- [Taps during a move land on the browser's pictures, not the page] → Moves are 300ms at most, and 150ms for drop and mode.
- [Two elements with the same name skip the move] → The e2e tests check that the move ran, on `/sheets` with recent sheets showing.
- [The list's scroll is restored after the browser's picture] → React Router restores it in a layout effect during the update callback, so the new picture has it. The e2e test for going back checks the row's position.
- [Browsers without View Transitions] → React Router changes the page as before.
- [Play and edit are laid out differently, so the `mode` fade shows both layouts for a moment] → It is 150ms. Lining up the two pages is #161; then the bar and the sheet can move as parts of their own.
- [A page that loads slowly] → The move starts once the data is there; until then the loading bar shows, as now.
