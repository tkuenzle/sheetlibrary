# Motion

How things move in Sheet Library, and when they don't. Every part that moves follows this page, through the tokens in `apps/web/app/ui/tokens.css`. Decided in #89. Page changes are built in #136, overlays in #160, skeletons in #137.

## Why things move

Motion shows where something came from and where it went. It is never decoration. Sheet Library is used on a music stand, mid-song, so motion stays calm and short and never makes anyone wait.

## Where things sit

```
              +-------------------+
              |  Edit (a mode)    |   the bar changes, the sheet stays
              +-------------------+
              |  A sheet          |   rises over the shell; Back drops it
              +---------^---------+
                        | the row's title becomes the sheet's heading
   +------------------------------------------------+
   | rail |  Sheets  <->  Collections  <->  a coll. |   peers: they fade
   +------------------------------------------------+
   Overlays sit above whatever is open.
```

- **The shell never moves.** The rail, its compact form and the bar at the bottom stay still on every change. Only the content takes part.
- **Peers fade.** Sheets, Collections and a collection fade into each other. Nothing slides between them: the rail's order is not a direction.
- **A sheet rises.** Opening a sheet lifts it over the shell, and Back reverses it, whether by the arrow or the browser. From a row, the row's title turns into the sheet's heading.
- **Edit is a mode, not a page.** Play to Edit and back keeps the sheet where it is. The bar takes its tonal color and its buttons change; the editing tools come in. The two pages don't line up yet, so for now the whole page fades briefly (#161).
- **A set has a direction.** Stepping through a set (#154) can slide to the next or the previous sheet, since the songs have an order.

## Page changes

Page changes use the browser's View Transitions, through React Router's `viewTransition` on a `<Link>` or a `navigate()`. The browser takes a picture of the old page and of the new one, and `apps/web/app/shell/page-moves.css` animates the two. A sheet's route is outside the shell, so on the frame it appears the shell is gone; only a picture of the old page lets the sheet rise over it.

- **Only moves that ask move.** The rail, the bottom bar, Collections, the sheet rows, Recent, "Edit", and the sheet's moves (`useSheetMoves().go()`) ask. A search, a key or a capo changes only the address and stays instant. React Router plays a move again when the browser steps back between the same two pages.
- **The kind follows from the two pages.** `shell/page-moves.ts` sets `data-move` on `<html>` when the page changes:

| `data-move` | From, to                                       | Move                                                    |
| ----------- | ---------------------------------------------- | ------------------------------------------------------- |
| `fade`      | a shell screen to another                      | the pictures fade into each other, `--motion-long`      |
| `rise`      | a shell screen to a sheet                      | the new picture rises over the old one, `--motion-long` |
| `drop`      | a sheet to a shell screen                      | the old picture drops off the new one, `--motion-short` |
| `mode`      | play and edit of one sheet                     | the pictures fade into each other, `--motion-short`     |
| `none`      | anything else, or after the browser's own move | at once                                                 |

- **Not the history's direction.** React Router reports "POP" for back and forward alike, and a link from a sheet to a collection is a push that should drop.
- **The rail has no name of its own.** In a fade, its pixels are the same in both pictures, and the browser's fade blends them so they stay solid. A named rail would be painted above everything else and cover a rising sheet.
- **The title moves through a shared name.** A row's title and the sheet's heading are named `sheet-title` while their sheet is in the move. One element per page may have a name, or the browser skips the whole move. Recent and the list on Sheets can show the same sheet, so a row's link puts its list in the location's state, and only the row in that list is named. Its move animates only `translate` and `scale`, from boxes `page-moves.ts` measures, so it runs off the main thread, unlike the browser's own move, which animates width and height. Both titles are `width: fit-content`, so their boxes have the same shape.
- **A page moves in with its skeleton.** Sheets, a collection, a sheet and the account page don't wait for their data: their client loaders hand it over as a promise, so the move starts right after the tap, and the new picture shows the page with bars where the data will be. Collections has its data already.

  ```
  tap -- move, page with bars --> data arrives --> rows (once the move has ended)
  ```

- **Rows don't swap in mid-move.** Data that arrives while the page still moves in waits for the move's animations to finish (`afterMove` in `shell/awaited.tsx`). Data that arrives before the move has started goes into the new picture, so the page moves in whole. A page that loads again without a move, after a change on a row or during a search, keeps what it shows. For now the rows replace the bars at once.
- **A late page cuts.** A move starts once the new page's data is there. When that took longer than the loading bar waits (`SLOW_WAIT`, 200ms), the person has already waited, so the page changes at once. With skeletons this only happens to pages that wait for their data, such as Edit.
- **The page that is open doesn't move.** A link to it, such as "Sheet Library" on Sheets, is `none`.
- **The browser's own move wins.** After a swipe back on an iPhone, Safari has already shown a move (`hasUAVisualTransition` on `popstate`), so the move is `none`.
- **Taps wait.** While a move plays, taps land on the pictures, not the page. That is why moves stay at 300ms or less.

## Overlays

- **Menus** fade and grow a little from their button. So do the panels that hang under their button on wider screens (the key, capo and View panels), and the chord input under its letter.
- **Dialogs** fade and grow a little from the centre, over a fading scrim.
- **Panels and bottom sheets** slide in from their edge, over a fading scrim: the opened rail, the help, the key, capo and View panels and photo import on a phone, and the docked chord input.
- **The "New sheet" menu on a phone:** its ways rise above the button one after another, the nearest first, and "Close" fades in with the scrim. They leave together.
- **Leaving** is the same move backwards, and faster.

Only `opacity`, `scale` and `translate` move (see "Off the main thread"). Coming in is a keyframe animation on `[open]` or on the element as it mounts. Leaving goes through `apps/web/app/ui/exit.ts`:

- **A dialog** is marked `data-closing`, its CSS plays a `forwards` exit, and `closeAfterExit()` closes it once its animations have finished. A dialog leaves the top layer the moment it closes, so it can't close first.
- **Something rendered only while open**, such as a menu's list, stays through its exit with `usePresence()`, which keeps it shown and `closing` until its animations have finished.
- **While it leaves, it is inert**, so a second tap on Cancel does nothing. A menu gives focus back as it starts to leave. A modal dialog can't: the page behind it is inert until it closes, and then the browser puts focus back on the opener.
- **Escape** is caught at `keydown` and plays the exit. A close that skips it, such as Android's back, still closes, and leaves no marks behind.
- **No exit** when the page closes the overlay, as when it leaves, or when a confirm dialog's action worked and the page moves on.

## Calm

- **No springs and no overshoot.** Things arrive and stop.
- **Exits are faster than entries.** Waiting for something to leave feels slow.
- **Nothing around a moving part shifts.** See the next section.

## Off the main thread

Every animation runs off the main thread. On a phone, the main thread is busiest exactly when things move: a new page renders, the sheet lays out its chords, data arrives. An animation that needs the main thread misses every frame it misses, and stutters. One the browser runs on its own (composited) keeps going.

- **Animate only `opacity`, `transform`, `translate`, `scale` and `rotate`.** Never `width`, `height`, `top`, `left`, `inset`, `margin` or `padding`, which lay out the page each frame, and never colors, shadows or `background`, which paint it each frame. To grow something, scale it. To move it, translate it. The Lyrics only switch's handle is a small example: it stays 24px and is scaled down when off.
- **A change of color is not animated.** Change it at once, or fade an element of the new color in with `opacity`.
- **View transitions are no exception.** The browser's own move of a named element animates its box's `width` and `height` when the two boxes differ in size, and that runs on the main thread. Replace it with `translate` and `scale` from boxes you measure, as the sheet's title does (see "Page changes").
- **Check it with a trace.** Record a performance trace with the `blink.animations` category while the animation runs. Chrome lists each animation it couldn't run off the main thread with `compositeFailed`, and names the cause in `unsupportedProperties`. The browser's `-ua-mix-blend-mode-plus-lighter` in a view transition is listed too; it doesn't move anything and can stay.

## Tokens

| Token             | Value                        | For                                                   |
| ----------------- | ---------------------------- | ----------------------------------------------------- |
| `--motion-short`  | 150ms                        | Leaving, and small changes of state, such as a switch |
| `--motion-medium` | 200ms                        | Overlays coming in: menus, dialogs, panels            |
| `--motion-long`   | 300ms                        | Page changes and the title turning into the heading   |
| `--ease-enter`    | `cubic-bezier(0, 0, 0, 1)`   | Things arriving (Material 3's standard decelerate)    |
| `--ease-exit`     | `cubic-bezier(0.3, 0, 1, 1)` | Things leaving (standard accelerate)                  |
| `--ease-move`     | `cubic-bezier(0.2, 0, 0, 1)` | Things that stay on screen and change (standard)      |

Use the tokens, never numbers. Signs that repeat are the exception for now: the loading bar slides and the skeleton bars pulse over 1.4s, by fading only. A token for them is open (#137). The `chord-editor` package takes its duration from `--chord-editor-motion`, which the app sets to `--motion-short`.

## What stays still

- **The editor's scroll to the cursor** jumps. Smooth scrolling would fight typing and the keyboard on a phone.
- **The save state** changes its text at once. It is a status, not an event.
- **Text and chords** never move on their own. A chord moves only while it is dragged, and lifts above the finger.
- **Old search results** stay as they are while a search loads. "Searching…" in the field and the loading bar show the wait. A dim was tried, with and without a fade: the new results often arrived just after it started, so the list blinked or seemed to jump.
- **Tooltips** show and hide at once. They only repeat a control's name.
- **The active section** changes its look at once. The person moved the cursor there, so a fade would tell them nothing.

## Reduced motion

With reduced motion, nothing moves or fades: things open, close and change at once.

- `tokens.css` sets the three durations to `0s`. A part that uses the tokens needs no rule of its own. Its animations still run and end at once, so code that waits for them to finish keeps working.
- Don't write `animation: none` to turn motion off: it fires no `animationend`, and parts that wait for it never close.
- Signs that repeat stand still instead: the loading bar fills its width, and the photo import's sign and the skeleton bars stop pulsing. These keep their own reduced-motion rule, and so does the `chord-editor` package, so it works without the app.
