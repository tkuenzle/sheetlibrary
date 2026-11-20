# Motion

How things move in Sheet Library, and when they don't. Every part that moves follows this page, through the tokens in `apps/web/app/ui/tokens.css`. Decided in #89. Page changes are built in #136 and moved to React's view transitions in #167, overlays in #160, skeletons in #137.

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

Page changes use the browser's View Transitions, through React's `<ViewTransition>`. One boundary in `root.tsx` holds the page. React starts the move, the browser takes a picture of the old page and of the new one, and `apps/web/app/shell/page-moves.css` animates the two by the kind of move. A sheet's route is outside the shell, so on the frame it appears the shell is gone; only a picture of the old page lets the sheet rise over it.

- **Every page change moves.** Whatever starts it, a link, a button, a form or the browser's Back and Forward, a change between two pages moves by its kind. A search, a key or a capo changes only the address and stays instant.
- **The kind follows from the two pages.** The root's client middleware (`pageMovesMiddleware` in `shell/page-moves.ts`) picks it once the new page's loaders are done, and hands it to React as the transition's type. The page's `<ViewTransition>` takes the type as its class:

| Kind   | From, to                                       | Move                                                    |
| ------ | ---------------------------------------------- | ------------------------------------------------------- |
| `fade` | a shell screen to another                      | the pictures fade into each other, `--motion-long`      |
| `rise` | a shell screen to a sheet                      | the new picture rises over the old one, `--motion-long` |
| `drop` | a sheet to a shell screen                      | the old picture drops off the new one, `--motion-short` |
| `mode` | play and edit of one sheet                     | the pictures fade into each other, `--motion-short`     |
| none   | anything else, or after the browser's own move | at once: no type, so React doesn't move                 |

- **The type rides on a pending action.** React Router starts its own Transition for the new page, with no way to add a type. So the middleware adds it inside an async action of its own that is still pending then, and React adds the types of a pending action to every Transition that finishes while it runs.
- **Not the history's direction.** React Router reports "POP" for back and forward alike, and a link from a sheet to a collection is a push that should drop.
- **A step back waits a moment.** React renders an update made during the browser's `popstate` at once, without a move, and a step back that loads nothing from the network finishes within it. So the middleware waits one task before it lets a step back load.
- **The page is the one picture.** The root isn't captured (`view-transition-name: none`), and the page carries the background, so its picture is as opaque as the root's was. Its frame doesn't animate: its box changes size between pages, and the browser would animate its width and height.
- **The rail has no name of its own.** It is part of the page's picture. In a fade, its pixels are the same in both pictures, and the browser's fade blends them so they stay solid. A named rail would be painted above everything else and cover a rising sheet.
- **The title moves through a shared name.** A row's title and the sheet's heading are each in a named `<ViewTransition>` (`TitleMove` in `shell/title-move.tsx`), which takes part only in a rise or a drop. React fails when two boundaries share a name, and Recent and the list on Sheets can show the same sheet, so each list names its rows apart (`title-list-…`, `title-recent-…`), and the heading takes the name of the list in the location's state. Its move animates only `translate` and `scale`: in `onShare`, `moveTitle()` swaps the keyframes of the browser's own move, which would animate width and height, for ones from the same two boxes. An animation of its own instead would run on the main thread. Both titles are `width: fit-content`, so their boxes have the same shape.
- **A page moves in with its skeleton.** Sheets, a collection, a sheet and the account page don't wait for their data: their client loaders hand it over as a promise, so the move starts right after the tap, and the new picture shows the page with bars where the data will be. Collections has its data already.

  ```
  tap -- move, page with bars --> data arrives --> rows
  ```

- **Bars never flash.** Where no move covers them, in Add sheets and Choose collections, and on a page that changes without a move (after Safari's own swipe back, or with reduced motion), the bars stay unseen for the first 200ms, keeping their room, and once seen stay at least 400ms (`useSkeleton` in `ui/skeleton.tsx`, `PageSkeleton` and `holdBars` in `shell/awaited.tsx`). While a move plays, they show from the start.
- **Rows show once the page is in.** React shows data that arrives while the page still moves in once the move has ended. On a fast connection it is mostly there before the new picture shows, so the page moves in whole. A page that loads again without a move, after a change on a row or during a search, keeps what it shows. For now the rows replace the bars at once.
- **A late page cuts.** A move starts once the new page's data is there. When that took longer than the loading bar waits (`SLOW_WAIT`, 200ms), the person has already waited, so the page changes at once. With skeletons this only happens to pages that wait for their data, such as Edit.
- **The page that is open doesn't move.** A link to it, such as "Sheet Library" on Sheets, has no kind.
- **The browser's own move wins.** After a swipe back on an iPhone, Safari has already shown a move (`hasUAVisualTransition` on `popstate`). The step back then doesn't wait, so React changes the page at once, under the browser's picture, and it has no kind.
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
- **View transitions are no exception.** The browser's own move of a named element animates its box's `width` and `height` when the two boxes differ in size, and that runs on the main thread. Replace it with `translate` and `scale` from the same boxes, as the sheet's title does, or don't animate the box at all, as the page's frame (see "Page changes").
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
