# Motion

How things move in Sheet Library, and when they don't. Every part that moves follows this page, through the tokens in `apps/web/app/ui/tokens.css`. Decided in #89. Page changes are built in #136 and moved to React's view transitions in #167, overlays in #160, skeletons in #137 and timed in #168. Lined up with Material 3 in #187.

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
- **The kind follows from the two pages.** The root's client middleware (`pageMovesMiddleware` in `shell/page-moves.ts`) picks it once the new page's loaders are done, and announces it. The page's `<ViewTransition>` takes the announced kind as its class in the render that reaches the new page:

| Kind   | From, to                                       | Move                                                    |
| ------ | ---------------------------------------------- | ------------------------------------------------------- |
| `fade` | a shell screen to another                      | the pictures fade into each other, `--motion-long`      |
| `rise` | a shell screen to a sheet                      | the new picture rises over the old one, `--motion-long` |
| `drop` | a sheet to a shell screen                      | the old picture drops off the new one, `--motion-short` |
| `mode` | play and edit of one sheet                     | the pictures fade into each other, `--motion-short`     |
| none   | anything else, or after the browser's own move | at once: nothing is announced, so React doesn't move    |

- **The move is announced, not typed.** React Router starts its own Transition for the new page, with no way to add a transition type. React queues types on the root, and whichever Transition commits next takes them: on a busy phone, React Router's render of the wait could, and the page then moved over itself while the new page came without a move. So the middleware puts the move in a small store (`announceMove`) and waits for that render. A store update renders at once, outside any Transition, so it doesn't move. Only the render that reaches the target gives the page its class, and the move is forgotten once it has played, so the page's data showing afterwards doesn't play it again.
- **Not the history's direction.** React Router reports "POP" for back and forward alike, and a link from a sheet to a collection is a push that should drop.
- **A step back waits a moment.** React renders an update made during the browser's `popstate` at once, without a move, and a step back that loads nothing from the network finishes within it. So the middleware waits one task before it lets a step back load.
- **The page is the one picture.** The root isn't captured (`view-transition-name: none`), and the page carries the background, so its picture is as opaque as the root's was. Its frame doesn't animate: its box changes size between pages, and the browser would animate its width and height.
- **The rail has no name of its own.** It is part of the page's picture. In a fade, its pixels are the same in both pictures, and the browser's fade blends them so they stay solid. A named rail would be painted above everything else and cover a rising sheet.
- **The title moves through a shared name.** A row's title and the sheet's heading are each in a named `<ViewTransition>` (`TitleMove` in `shell/title-move.tsx`), which takes part only while a rise or a drop is announced. React reads a leaving title's class from its last render, which is why the move is announced before the page changes. React shares no element outside the window, so the title doesn't move to a row that is scrolled away. React fails when two boundaries share a name, and Recent and the list on Sheets can show the same sheet, so each list names its rows apart (`title-list-…`, `title-recent-…`), and the heading takes the name of the list in the location's state. Its move animates only `translate` and `scale`: in `onShare`, `moveTitle()` swaps the keyframes of the browser's own move, which would animate width and height, for ones from the same two boxes. An animation of its own instead would run on the main thread. Both titles are `width: fit-content`, so their boxes have the same shape.
- **A fast page moves in whole, a slow one with its skeleton.** Sheets, a collection, a sheet and the account page wait for their data until at most 150ms after the tap (`HEAD_START`, `handOver()` in `shell/awaited.tsx`). What React Router does before the loader, such as fetching `/__manifest` or the route's code, counts toward the 150ms, so the wait never pushes a page past the loading bar on its own. Data that comes in time moves in with the page. Otherwise the client loader hands it over as a promise, the move starts, and the new picture shows the page with bars where the data will be. A fast page feels snappy that way; a slow one only starts 150ms later, and it shows a skeleton anyway. Collections has its data already.

  ```
  fast:  tap -- up to 150ms, old page --> move, whole page
  slow:  tap -- 150ms, old page --> move, page with bars --> data arrives --> rows
  ```

- **Back shows the page as it was left.** Collections, a collection, the account page and a search keep what they last showed, for the last 10 addresses (`shell/kept.ts`). A step back or forward to one of them shows it at once, with the shell's collections, so the drop, the title's move into its row and the scroll all come back without waiting for the server. Then what's on screen loads again in the background (`LoadKeptAgain`), after the move, and fresh data replaces it without a move. Only what showed as it was left loads again, so a failure in that load changes nothing on screen. The root and a shell that stayed on screen sit it out.
- **Back to Sheets waits for Recent.** Opening a sheet changes Recent, so a step back to Sheets waits up to 150ms for the fresh page, as above. If it comes later, or after the browser's own move, Sheets shows the list as it was left with bars only in Recent (`handOverBack()`). Recent's cards all have one height, so its bars take their room.

  ```
  Back, kept:     tap --> drop, page as left --> fresh data, in place
  Back to Sheets: tap -- up to 150ms --> drop, fresh page
                  tap -- 150ms --> drop, list as left, bars in Recent --> cards
  ```

- **A change forgets what Back shows.** Any change to the person's data forgets every kept page: a form or a fetcher in the root's client middleware (`keptMiddleware`), a plain request through `sendChange()` in `app/changes.ts`. A step back after a change loads as any other move.
- **Bars never flash.** A page's bars show at once, with or without a move. The data handed over is held until 400ms after the skeleton has shown (`SKELETON_HOLD`, `noteSkeletonShown()`), which can be well after the handover, as when the page waits for its stylesheet. React has a hold of its own for reveals, but it doesn't apply to a page's first one, which comes as soon as the move has ended. In Add sheets and Choose collections, the bars stay unseen for the first 200ms, keeping their room, and once seen stay at least 400ms (`useSkeleton` in `ui/skeleton.tsx`).
- **Rows show once the page is in.** React shows data that arrives while the page still moves in once the move has ended. A page that loads again without a move, after a change on a row or during a search, keeps what it shows.
- **Rows fade in where the bars were.** When data replaces a page's bars, what stood for them fades in, `--motion-short` with `--ease-linear`, on `opacity` only, as Material 3's fade does: the rows, Recent's cards, a sheet's chips and lines, the account's email and passkeys, and a collection's name and count or a sheet's title and artist when they were bars too. What the skeleton showed for real, such as the heading and the search field, stays as it is. `PageData` marks its content as arriving for one commit (`<Arriving>` in `ui/arriving.tsx`), and each part reads that once as it mounts (`useArrives`). So the fade plays once: rows that mount later, such as new search results, a page that arrives whole and a page shown as it was left show at once. The bars go at once and the rows fade in from nothing: Suspense has no way to let its fallback leave slowly. It is not a view transition, so taps and typing go on while it plays. The lists in Add sheets and Choose collections fade in the same way once their bars were seen (`useBarsSeen` in `ui/skeleton.tsx`); a quick list, whose bars stayed unseen, shows at once.
- **A late page cuts.** A move starts once the new page's data is there. When the loading bar has shown by then (after `SLOW_WAIT`, 200ms), the person has already waited, so the page changes at once. With skeletons this only happens to pages that wait for their data, such as Edit, or when the page's code is slow. On a step back, the shell's collections come from what it kept.
- **The page that is open doesn't move.** A link to it, such as "Sheet Library" on Sheets, has no kind.
- **The browser's own move wins.** After a swipe back on an iPhone, Safari has already shown a move (`hasUAVisualTransition` on `popstate`). The step back then doesn't wait, not even for the page's data (`browserMovedContext`), so React changes the page at once, under the browser's picture, as it was left where it was kept, with bars where data is still on its way, and it has no kind.
- **Taps wait.** While a move plays, taps land on the pictures, not the page. That is why moves stay at 300ms or less.

## Overlays

- **Menus** fade and grow a little from their button. So do the panels that hang under their button on wider screens (the key, capo and View panels), and the chord input under its letter.
- **Dialogs** fade and grow a little from the centre, over a fading scrim.
- **Panels and bottom sheets** slide in from their edge, over a fading scrim: the opened rail, the help, the key, capo and View panels and photo import on a phone, and the docked chord input. Photo import on a phone can nearly fill the screen, so it takes longer, on the emphasized curves (see "Material 3").
- **The "New sheet" menu on a phone:** its ways rise above the button one after another, the nearest first, and "Close" fades in with the scrim. They leave together.
- **Leaving** is the same move backwards, and faster.

Only `opacity`, `scale` and `translate` move (see "Off the main thread"). Coming in is a keyframe animation on `[open]` or on the element as it mounts. Leaving goes through `apps/web/app/ui/exit.ts`:

- **A dialog** is marked `data-closing`, its CSS plays a `forwards` exit, and `closeAfterExit()` closes it once its animations have finished. A dialog leaves the top layer the moment it closes, so it can't close first.
- **Something rendered only while open**, such as a menu's list, stays through its exit with `usePresence()`, which keeps it shown and `closing` until its animations have finished.
- **While it leaves, it is inert**, so a second tap on Cancel does nothing. A menu gives focus back as it starts to leave. A modal dialog can't: the page behind it is inert until it closes, and then the browser puts focus back on the opener.
- **Escape** is caught at `keydown` and plays the exit. A close that skips it, such as Android's back, still closes, and leaves no marks behind.
- **No exit** when the page closes the overlay, as when it leaves, or when a confirm dialog's action worked and the page moves on.

## Calm

- **No springs and no overshoot.** Things arrive and stop. "Material 3" says why there are no springs.
- **Exits are faster than entries.** Waiting for something to leave feels slow.
- **Nothing around a moving part shifts.** See the next section.

## Off the main thread

Every animation runs off the main thread. On a phone, the main thread is busiest exactly when things move: a new page renders, the sheet lays out its chords, data arrives. An animation that needs the main thread misses every frame it misses, and stutters. One the browser runs on its own (composited) keeps going.

- **Animate only `opacity`, `transform`, `translate`, `scale` and `rotate`.** Never `width`, `height`, `top`, `left`, `inset`, `margin` or `padding`, which lay out the page each frame, and never colors, shadows or `background`, which paint it each frame. To grow something, scale it. To move it, translate it. The Lyrics only switch's handle is a small example: it stays 24px and is scaled down when off.
- **A change of color is not animated.** Change it at once, or fade an element of the new color in with `opacity`.
- **View transitions are no exception.** The browser's own move of a named element animates its box's `width` and `height` when the two boxes differ in size, and that runs on the main thread. Replace it with `translate` and `scale` from the same boxes, as the sheet's title does, or don't animate the box at all, as the page's frame (see "Page changes").
- **Check it with a trace.** Record a performance trace with the `blink.animations` category while the animation runs. Chrome lists each animation it couldn't run off the main thread with `compositeFailed`, and names the cause in `unsupportedProperties`. The browser's `-ua-mix-blend-mode-plus-lighter` in a view transition is listed too; it doesn't move anything and can stay.

## Material 3

Our motion follows Material 3, in this order (#187):

1. **Our constraints first:** off the main thread, page moves at 300ms or less, reduced motion, calm.
2. **Then Material 3's reasoning:** a curve for each role, a duration that grows with the area that moves, and its fade patterns.
3. **Then its numbers,** as defaults wherever our constraints don't object.

Material 3 doesn't give one set of numbers. Its motion doc for Android (`docs/theming/Motion.md` in Material Components for Android) gives its fade 150ms linear in and 75ms out, and its fade through and shared axis `cubic-bezier(0.4, 0, 0.2, 1)`. The library's code gives the fade 400ms on emphasized decelerate in and 150ms on emphasized accelerate out, and the fade through and shared axis the emphasized curve. So we follow the reasoning, not either source number for number.

- **A curve for each role.** What stays on screen and changes takes standard (`--ease-move`), what comes in standard decelerate (`--ease-enter`), what leaves standard accelerate (`--ease-exit`).
- **Large overlays take the emphasized pair.** Emphasized decelerate covers most of the way at once and then lands softly. On a 60Hz phone, photo import's first frame covers about 45% of the way, and it looks arrived after about 150ms, as quick as a 200ms slide on standard decelerate. The extra time goes into the landing. Standard decelerate over 300ms would look arrived only after about 220ms.
- **Page moves stay on standard.** A view transition holds taps until it ends ("Taps wait"). On emphasized, a sheet would look finished after about 150ms but still hold taps until 300ms, so a quick tap would do nothing. Overlays take taps while they move, so a long landing costs them nothing.
- **The duration grows with the area.** Menus, dialogs and the surfaces that partly cover the screen come in over 200ms: the docked chord input, the key, capo and View panels on a phone, the opened rail and help. Material 3's "default" spring, for such surfaces, looks settled after about 170 to 195ms. Photo import on a phone can nearly fill the screen, so it takes 300ms in and 200ms out, like Material 3's "slow" spring for the full screen (about 255 to 295ms). It keeps that time when it is small, with no pages yet: it looks arrived after about 150ms anyway, and CSS can't time a move by an element's height. Three durations cover this, so we don't take Material 3's sixteen.
- **What only fades is linear.** A curve that front-loads its change spends most of a fade in its first frames, and the fade is barely seen (#185). So the scrims, "Close" under the "New sheet" ways and rows replacing their bars fade linearly, as Material 3's fade does. A menu's or a dialog's opacity takes the curve of its growth.

Where we differ, and why:

| Material 3                      | Ours                                 | Why                                                                                                                                                                                                                                                                                   |
| ------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Moves of 400 and 500ms          | Page moves of 300ms or less          | Taps land on the pictures while a view transition plays. On Android a tap can interrupt a move.                                                                                                                                                                                       |
| A fade through between peers    | The shell's screens crossfade        | The rail is part of the page's picture. It stays solid because the browser adds the two pictures, and in a crossfade their opacities always sum to one. A fade through fades the old one out before the new one comes in, so the rail would nearly vanish a third of the way through. |
| Springs (Material 3 Expressive) | Durations and curves                 | Its effects springs settle in about 110, 165 and 230ms, close to our durations. A spring's gain is that an interrupted move keeps its speed, and CSS keyframes can't do that, even with `linear()`. Its spatial springs overshoot a little, and things here arrive and stop.          |
| Its fade grows from 0.8         | Overlays grow from 0.95              | Calmer, for a screen on a music stand.                                                                                                                                                                                                                                                |
| Nothing like it                 | The "New sheet" ways rise one by one | Ours, from #160. Material 3 has no move to follow instead.                                                                                                                                                                                                                            |

## Tokens

| Token                     | Value                             | For                                                                              |
| ------------------------- | --------------------------------- | -------------------------------------------------------------------------------- |
| `--motion-short`          | 150ms                             | Leaving, and small changes of state, such as a switch                            |
| `--motion-medium`         | 200ms                             | Overlays coming in: menus, dialogs, panels; large overlays leaving               |
| `--motion-long`           | 300ms                             | Page changes, the title turning into the heading; large overlays coming in       |
| `--ease-enter`            | `cubic-bezier(0, 0, 0, 1)`        | Things arriving (Material 3's standard decelerate)                               |
| `--ease-exit`             | `cubic-bezier(0.3, 0, 1, 1)`      | Things leaving (standard accelerate)                                             |
| `--ease-move`             | `cubic-bezier(0.2, 0, 0, 1)`      | Things that stay on screen and change (standard)                                 |
| `--ease-enter-emphasized` | `cubic-bezier(0.05, 0.7, 0.1, 1)` | Large overlays arriving, such as photo import on a phone (emphasized decelerate) |
| `--ease-exit-emphasized`  | `cubic-bezier(0.3, 0, 0.8, 0.15)` | Large overlays leaving (emphasized accelerate)                                   |
| `--ease-linear`           | `linear`                          | What only fades: scrims, and rows replacing their bars                           |

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
