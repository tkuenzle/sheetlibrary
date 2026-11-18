# Design

## Context

Three overlays already play an exit, each in its own way:

```
 EdgePanel    React state `closing` -> data-closing -> getAnimations().finished -> close()
 usePanel     setAttribute          -> data-closing -> getAnimations().finished -> close()
 ChordInput   prop `closing`        -> data-closing -> onAnimationEnd, or a 300ms timer
```

Only the docked chord input waits for its exit; the floating one, under its letter on wider screens, is removed at once.

The overlays this change adds come in two kinds. A `<dialog>` stays in the page but leaves the top layer the moment `close()` runs, so it has to be marked, wait, and only then close. A menu (`Menu`, the chord input) is only rendered while open, so React would remove it at once; it needs a third state between open and gone.

## Goals / Non-Goals

**Goals:**
- One way to play an exit, used by every overlay, the existing three included.

**Non-Goals:**
- View Transitions for overlays: while one runs, taps on the whole page are lost.
- Tooltips. They stay instant.

## Decisions

### Keyframes in, a marked exit out

Coming in is a CSS keyframe animation on `[open]` (dialogs) or on the element as it mounts (menus), as EdgePanel and the key panel already do. Leaving is a `forwards` keyframe on `[data-closing]`, and the code closes once it is done.

- Instead of `@starting-style` with transitions: keyframes are what the existing overlays use, and they work the same for dialogs and for menus.
- Instead of a CSS-only exit (`transition: display, overlay allow-discrete`): Safari has no `overlay`, so a closing dialog would drop out of the top layer mid-move, and CSS can't keep an unmounted menu on screen.

### Two helpers in `ui/exit.ts`

```
 closeAfterExit(dialog)     any <dialog>
   closing already? return
   set data-closing and inert
   wait for getAnimations({ subtree: true }) to finish
   remove data-closing and inert, dialog.close()

 usePresence(open)          things rendered while open
   -> { shown, closing, ref }
   open turns false: still shown, closing, until its animations finish
```

- `getAnimations()` rather than `animationend`: it waits for the box, the scrim and the staggered ways together, without filtering events from children, and it settles at once when there is nothing to wait for, as with reduced motion (0s) or in a browser without the API.
- EdgePanel, usePanel and ChordInput move onto these, and ChordInput's 300ms timer goes.

### Escape, and closes that skip the exit

Escape is stopped at `keydown` and calls the exit, as EdgePanel does now, so the native `cancel` never closes the dialog first. Chrome only lets `cancel` be stopped after the person has interacted since the last one, so a second Escape or Android's back can still close a dialog directly. So `onClose` always tidies up (state, focus), whichever way the dialog closed.

### Focus, and taps blocked

The leaving overlay is `inert`, so a second tap or a key on Cancel or an item does nothing.

A menu, a panel under its button and the floating chord input give focus back when the exit starts. A modal dialog can't: the page behind it is inert until `close()`, and focusing the opener before then leaves focus where it is (tried in Chromium). `close()` then puts focus back on the opener by itself, at most `--motion-short` after the exit started.

### What doesn't play an exit

- A confirm dialog whose action worked: the page leaves, and its move takes the dialog along.
- An overlay its page closes, through `open` turning false or an unmount: it closes at once, as now.

### The moves

```
 grow            opacity 0 -> 1, scale 0.95 -> 1
 menu origin     the button's corner, by placement:
                   below-end   -> top right      above-end -> bottom right
                   below-start -> top left       beside    -> top left
 panel, wider    as a menu, from the top at its button's side
 chord input,    as a menu, from its top left, at its letter
   wider
 dialog origin   the centre; the scrim fades on ::backdrop
 photo import    grows on wider screens, slides up from the bottom on a phone
 floating ways   rise 16px and fade, nearest the button first, about
                 30ms apart through a --i set on each; they leave together
 Close button    fades in with the scrim
 timing          in:  --motion-medium, --ease-enter
                 out: --motion-short,  --ease-exit
```

Only `opacity`, `scale` and `translate` animate, so every move runs off the main thread. The stagger step is not a token. It is a delay between items, not a duration, so it lives in `floating-button.css` as a fraction of `--motion-medium`, and goes to 0s with it under reduced motion.

## Risks / Trade-offs

- [Unit tests render on the server and can't see motion] → Opening, leaving, the blocked second tap and reduced motion are checked in e2e, through `document.getAnimations()` as `page-moves.spec.ts` does.
- [Moving three working overlays onto new code could break them] → Their existing e2e tests (the rail, the help, the key panel, the chord input) run unchanged and must still pass.
