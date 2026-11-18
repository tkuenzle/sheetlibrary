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

**The title moves off the main thread.** The browser's own move of a named element animates its box's width and height, which Chrome runs on the main thread (a trace reports `unsupportedProperties: width, height`), so the title stuttered while the new sheet was set up. `<PageMoves />` measures the title's box in the old page when the move starts and in the new page after the commit, in a passive effect, after React Router has restored the scroll. It writes where the move starts as `--title-dx`, `--title-dy`, `--title-sx` and `--title-sy` on `<html>`. The CSS replaces the browser's move with `title-move`, which animates only `translate` and `scale` from those values. The box keeps its size and place in the new page. Both titles are `width: fit-content`, so the boxes have the same shape and the text scales evenly. Considered: reading the browser's own keyframes once the move is set up and replacing its animation. It needs `document.activeViewTransition` and starts an animation only to cancel it.

**Moves made in code ask too.** `useSheetMoves().go()` passes `viewTransition` when it opens an address. A step back plays the move React Router remembered. Edit mode's held move, made again after saving, goes through the same path.

**A late page cuts.** React Router starts the move only once the new page's data is there, so on a slow connection the move came on top of the wait. The root measures from the start of the wait (`useNavigation()` leaving idle) to the start of the move (React Router's transition context turning on), and a wait longer than `SLOW_WAIT`, the loading bar's delay, gives `none`. The measuring sits in its own `<PageMoves />` in the root, so a wait doesn't render the pages again. Considered: skeletons now, so a move starts at the tap. That splits every loader into a fast and a slow part, which is #137.

**Every move sets its kind.** A link to the page that is open asks for a move too. The kind is set on each new location, and a move to the same path is `none`, so a kind from an earlier move can't play again.

**The browser's own move wins.** A `popstate` listener reads `hasUAVisualTransition`. When the browser already showed a move, as Safari does after a swipe from the edge, the root sets `data-move="none"`, and the CSS gives the pictures no animation. The new page shows at once, after the browser's swipe.

## Risks / Trade-offs

- [Safari may not report `hasUAVisualTransition` on `popstate`] → A spike in Safari on an iPhone comes first. Without it, look for another sign of a swipe, or turn off the move on back in Safari.
- [Taps during a move land on the browser's pictures, not the page] → Moves are 300ms at most, and 150ms for drop and mode.
- [Two elements with the same name skip the move] → The e2e tests check that the move ran, on `/sheets` with recent sheets showing.
- [The list's scroll is restored after the browser's picture] → React Router restores it in a layout effect during the update callback, so the new picture has it. The e2e test for going back checks the row's position.
- [Browsers without View Transitions] → React Router changes the page as before.
- [Play and edit are laid out differently, so the `mode` fade shows both layouts for a moment] → It is 150ms. Lining up the two pages is #161; then the bar and the sheet can move as parts of their own.
- [A page that loads slowly] → The move starts once the data is there; until then the loading bar shows, as now.
