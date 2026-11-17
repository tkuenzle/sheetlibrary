# Motion

How things move in Sheet Library, and when they don't. Every part that moves follows this page, through the tokens in `apps/web/app/ui/tokens.css`. Decided in #89; page changes and overlays are built in #136.

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
- **Edit is a mode, not a page.** Play to Edit and back keeps the sheet where it is. The bar takes its tonal color and its buttons change; the editing tools come in.
- **A set has a direction.** Stepping through a set (#154) can slide to the next or the previous sheet, since the songs have an order.

## Overlays

- **Menus** fade and grow a little from their button.
- **Dialogs** fade and grow a little from the centre, over a fading scrim.
- **Panels and bottom sheets** slide in from their edge, over a fading scrim: the opened rail, the help, the key panel and View on a phone, and the docked chord input.
- **The "New sheet" menu on a phone:** its ways rise above the button one after another.
- **Leaving** is the same move backwards, and faster.

## Calm

- **No springs and no overshoot.** Things arrive and stop.
- **Exits are faster than entries.** Waiting for something to leave feels slow.
- **Only `opacity` and `transform` move.** Layout properties such as `left` or `width` are never animated, so nothing around the moving part shifts.

## Tokens

| Token             | Value                        | For                                                            |
| ----------------- | ---------------------------- | -------------------------------------------------------------- |
| `--motion-short`  | 150ms                        | Leaving, and small changes of state: a switch, a fade of color |
| `--motion-medium` | 200ms                        | Overlays coming in: menus, dialogs, panels                     |
| `--motion-long`   | 300ms                        | Page changes and the title turning into the heading            |
| `--ease-enter`    | `cubic-bezier(0, 0, 0, 1)`   | Things arriving (Material 3's standard decelerate)             |
| `--ease-exit`     | `cubic-bezier(0.3, 0, 1, 1)` | Things leaving (standard accelerate)                           |
| `--ease-move`     | `cubic-bezier(0.2, 0, 0, 1)` | Things that stay on screen and change (standard)               |

Use the tokens, never numbers. The `chord-editor` package takes its duration from `--chord-editor-motion`, which the app sets to `--motion-short`.

## What stays still

- **The editor's scroll to the cursor** jumps. Smooth scrolling would fight typing and the keyboard on a phone.
- **The save state** changes its text at once. It is a status, not an event.
- **Text and chords** never move on their own. A chord moves only while it is dragged, and lifts above the finger.
- **Old search results** dim at once while a search loads, and show at full strength the moment the new ones arrive. A fade was tried: the new results often arrived while it ran, so the list seemed to jump mid-fade.
- **The active section** changes its look at once. The person moved the cursor there, so a fade would tell them nothing.

## Reduced motion

With reduced motion, nothing moves or fades: things open, close and change at once.

- `tokens.css` sets the three durations to `0s`. A part that uses the tokens needs no rule of its own. Its animations still run and end at once, so code that waits for them to finish keeps working.
- Don't write `animation: none` to turn motion off: it fires no `animationend`, and parts that wait for it never close.
- Signs that repeat stand still instead: the loading bar fills its width, and the photo import's sign stops pulsing. These keep their own reduced-motion rule, and so does the `chord-editor` package, so it works without the app.
