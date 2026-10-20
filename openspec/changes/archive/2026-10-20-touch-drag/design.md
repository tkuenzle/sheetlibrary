# Design

## Context

`packages/chord-editor/src/chord-layer.ts` moves a dragged label with a `transform` that keeps its offset to the pointer. `dropTarget()` aims from the label's box, not from the pointer: the letter under its left edge, one label height below its bottom. So moving the label moves the aim and the drop caret with it. The frame loop in `scroll()` runs during a whole drag, and scrolls when the pointer is within 48px of the window's top or bottom.

## Decisions

**The lift is CSS, on top of the transform.** On a touch drag (`pointerType === "touch"` at pointerdown), the label gets the class `is-lifted`. The stylesheet moves it up with the separate `translate` property, which adds to the `transform` that follows the pointer, and slides it with a short `transition` on `translate`. A transition on `transform` was rejected, because it would make the label lag behind the finger. Pen and mouse drags don't get the class.

**The lift is a length, not a number of lines.** `--chord-editor-touch-lift` takes any CSS length, for example `4.5em` or `calc(40px + 2em)`. The finger stays the same size when the font grows, while the label and the caret grow with it, so the right lift can be part fixed, part relative. In a custom property, `em` would be worked out at the label, which is 0.8 of the lyrics' size, so the layer turns the lift into pixels through a registered `@property`, and `em` means the lyrics' size as in the other properties. The default is `4.2em`, about 1.5 lines, which worked well on an Android phone.

**The aim follows the lifted label without new code.** `getBoundingClientRect()` includes `translate`, so `dropTarget()` already aims under the lifted label. While the label slides, the pointer may not move, so the frame loop also updates the target on every frame of a touch drag, not only after a scroll. The drop uses the target the caret shows.

**Scrolling up uses the label on touch.** For a touch drag, the frame loop measures the top zone from the label's top instead of the pointer. The bottom zone still uses the pointer, since the label can never come near the bottom. Mouse and pen drags keep using the pointer for both.

**The test page takes a lift to try.** `/sheet-editor?lift=<length>` sets `--chord-editor-touch-lift` on the editor, so values can be tried on a phone with one preview link instead of a deploy for each.

**The test helper measures the lift.** `startDrag` in `sheet-editor.spec.ts` keeps the label's offset to the pointer. It starts the drag with one move, so the pointer holds still while the label slides, waits for the label's animations to finish and measures the offset again, so `moveLabelTo` still puts the label where a test wants it.

## Risks / Trade-offs

- [Near the end of a long song, the finger may not get far enough below the last line to aim at it.] → It works on `/sheet-editor`, which has the Done button below the sheet. A page without anything below the sheet is untested. Listed in the proposal's open questions.
- [Aiming with a lifted label takes getting used to.] → Tried by hand before merging. If it doesn't work, the change is dropped for a loupe.
- [iPhone is untested.] → Accepted in the roadmap.
