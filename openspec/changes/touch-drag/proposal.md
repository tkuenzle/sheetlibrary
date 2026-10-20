# Proposal

## Why

When a chord is dragged with a finger, the finger covers the label and the drop caret under it, so the user can't see where the chord will land. This is the third part of M2d in `docs/roadmap.md`.

## What Changes

- On a touch drag, the label lifts above the finger, far enough that the label and the drop caret under it can both be seen. The chord lands under the label, as it does today, not under the finger.
- The label slides up when the drag starts, instead of jumping.
- The lift is a CSS custom property, about 1.5 lines by default. The value is tried on an Android phone with the preview link and fixed before the change is merged. If lifting doesn't work in practice, the change is dropped and a loupe is explored instead.
- On a touch drag, the page scrolls up when the label gets near the top of the window. It scrolls down when the finger gets near the bottom, as today.
- Mouse and pen drags don't change.
- `docs/roadmap.md`: touch-drag is marked done, with the approach.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `chord-editor`: a touch drag lifts the label above the finger, and scrolling up follows the label.

## Impact

- `packages/chord-editor`: the chord layer offsets a touch-dragged label and starts scrolling up from the label's position. The stylesheet gets the lift property and the slide.
- `apps/web`: the Playwright drag helper allows for the lift on the phone project, and new tests cover it.
- `docs/roadmap.md`: as above.

## Open Questions

- The last line of a long song can be reached at the end of the page on `/sheet-editor`, but only because the Done button leaves room below the sheet. A page that ends right after the sheet, such as M2f's, may need room below it.
- iPhone is still untested.
- A bigger label while dragging, if the lift alone isn't enough.
