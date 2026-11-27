# Design

## Context

Our curves are Material 3's standard set: `--ease-move` (standard), `--ease-enter` (standard decelerate) and `--ease-exit` (standard accelerate), plus `--ease-linear` since #185. There are three durations: 150, 200 and 300ms. Every surface that slides in from an edge takes 200ms in and 150ms out, from the 120px docked chord input up to photo import, which nearly fills a phone.

Material 3's sources disagree. Its motion doc (`docs/theming/Motion.md` in Material Components for Android) gives the fade as 150ms linear in and 75ms out, and the fade through and shared axis as `cubic-bezier(0.4, 0, 0.2, 1)`. The library's code gives the fade 400ms on emphasized decelerate in and 150ms on emphasized accelerate out, and the fade through and shared axis the emphasized curve.

## Goals / Non-Goals

**Goals:**
- One stated way to follow Material 3, so that later motion work has a rule to apply.

**Non-Goals:**
- Matching either Material 3 source number for number.
- New kinds of moves, such as a fade through or a container transform.

## Decisions

### Material 3's reasoning, not one source's numbers

The order is: our constraints, then Material 3's reasoning, then its numbers as defaults. Copying one source would tie us to a document that is already out of step with its own code, and to its next revision. Its reasoning holds on any platform: a curve for each role (enter, exit, stay on screen), the duration growing with the area, and fades that don't drag. Its numbers assume Android, where a tap can interrupt a move. Our view transitions hold taps until they end, so page moves stay at 300ms or less.

### Duration by area, without new tokens

Material 3's springs give the same split as its duration tables. Its "default" spring, for surfaces that partly cover the screen, looks settled after about 170 to 195ms. Its "slow" spring, for the full screen, looks settled after about 255 to 295ms. So 200ms already fits the partial surfaces, and only photo import is too quick. It takes `--motion-long` in and `--motion-medium` out. Alternative: Material 3's sixteen duration tokens. Rejected for now: one surface needs a longer time, and the three tokens cover it.

### The curve for large surfaces is chosen by eye

Material 3's emphasized decelerate, `cubic-bezier(0.05, 0.7, 0.1, 1)`, covers about 76% of the distance in the first 18% of the time, against 60% for our standard decelerate. It then settles slowly. At 300ms, photo import would look about as quick as it does now and arrive more softly. But three quarters of the way in about 54ms may look like a jump, and Material 3 pairs the curve with 400ms. Numbers can't settle that. A page in the design canvas plays the variants side by side on a phone-sized frame, and the user picks:

- Photo import sliding up: today (200ms, standard decelerate), 300ms on standard decelerate, 300ms on emphasized decelerate, and Material 3's own 400ms on emphasized decelerate. Each leaves on its pair: standard accelerate, or emphasized accelerate (`cubic-bezier(0.3, 0, 0.8, 0.15)`).
- A sheet rising over the shell, 300ms: standard decelerate against emphasized decelerate.

**Picked: emphasized for photo import, standard for the sheet's rise.**

- Photo import takes emphasized decelerate in and emphasized accelerate out, at 300 and 200ms. On a 60Hz phone its first frame covers about 45% of the way, against 41% today, and it looks arrived after about 150ms, as today (about 146ms). The extra time goes into a soft landing. Standard at 300ms would look arrived only after about 219ms, so it would feel slower. Material 3's 400ms adds only a longer landing.
- Since it looks arrived after about 150ms, a small photo import, with no pages yet, doesn't feel slow at 300ms. It keeps one duration, not one by its height, which CSS can't measure.
- The sheet's rise keeps standard decelerate, and the drop standard accelerate. A view transition holds taps until it ends. On emphasized, the sheet would look finished after about 150ms but hold taps until 300ms, so a quick tap would do nothing. Overlays take taps while they move, so the long landing costs them nothing.
- The rule: emphasized for large overlays, standard for page moves. The emphasized pair gets tokens of its own, `--ease-enter-emphasized` and `--ease-exit-emphasized`.

### Opacity alone is linear

A curve that front-loads its change, such as decelerate, spends most of a fade in its first frames (#185). The scrims, "Close" under the "New sheet" ways and the fades behind the edge panels and the key panel on a phone change only opacity, so they take `--ease-linear` and keep their durations.

### What stays, and why

- **The shell's screens crossfade.** The rail is part of the page's picture, and stays solid because the browser adds the two pictures and their opacities always sum to one. A fade through fades the old picture out before the new one comes in, so near a third of the way the rail would almost vanish. A fade through would need the content area to be captured on its own.
- **No springs.** Material 3's effects springs settle in about 110, 165 and 230ms, close to our durations. A spring's real gain is that an interrupted move keeps its speed, and CSS keyframes can't do that, even with `linear()`.
- **Overlays grow from 0.95, not 0.8.** It is calmer, for a screen on a music stand.
- **The "New sheet" ways rise one after another.** Material 3 has no counterpart.

## Risks / Trade-offs

- [The canvas page may not match the app, since the app's pictures come from view transitions] → The page uses the same keyframes and tokens, and the pick is checked in the app with the browser-check skill before it is final.
- [The user may want other variants once they see the page] → The canvas page is the first task, and the change is updated with what is chosen before the CSS changes.
