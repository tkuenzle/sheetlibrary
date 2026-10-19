# Design

## Context

The spike's chord layer (`apps/web/app/spike/chord-layer.ts`) already drags labels: pointer events on the layer, a 6px threshold between a tap and a drag, `letterAt` for the letter under the label's left edge, a drop caret, and a `moveChord` command. It hands the drop to the app through `onChordDrop`. The package's layer (`packages/chord-editor/src/chord-layer.ts`) only listens for `click`, and makes labels outside the active section ignore the pointer (`is-inert`).

## Decisions

**The layer moves the chord itself.** The drag code moves into the package's chord layer, and the layer dispatches the move. The spike's `onChordDrop` callback is dropped: moving a chord needs nothing from the app. `onChordClick` stays, and fires on a pointer release that didn't pass the threshold. The `click` listener goes away. A new `onDragStart` tells the app when a drag passes the threshold, so it can close the chord input, which the app owns. Only the primary pointer starts a drag, and only one drag runs at a time.

**A dragged label is fixed to the window.** While dragging, the label gets `position: fixed` at its place on screen and follows the pointer with a transform. Moving it inside the layer was tried first: the transformed label made the page longer as it went down, so scrolling never reached the end. A fixed element doesn't add to the page's size, and it doesn't move when the page scrolls. When the drag ends, the layer places it again as usual.

**A drop target is a letter and a spot in its pile.** `moveChord(id, pos, index)` takes the chord off its letter and puts it at `index` among the chords on the letter at `pos`. Without an index it goes last. When the chord stays on its own letter, the index is counted after it is taken off.

**The pile hit test uses the labels.** The layer knows every label's box. If the dragged label's left edge is over a pile's labels on the same row, the target is that pile. The spot comes from comparing the edge with the middle of each label, and the caret is drawn in the chord row between the labels. Otherwise the target comes from `letterAt` as in the spike, and the caret is drawn in the text.

**Targets outside the active section are ignored.** A target whose position is outside the active section counts as no target. The caret hides, and letting go puts the label back. Nothing is dispatched, so the active section doesn't change.

**Escape is caught during a drag.** While dragging, the layer listens for `keydown` on the window in the capture phase. On Escape, it cancels the drag and stops the event, so the editor's Escape (end editing) doesn't run.

**Scrolling runs in an animation frame loop.** While the pointer is within an edge zone at the top or bottom of the window, a frame loop scrolls the window, faster closer to the edge. Pointer events stop when a finger holds still, so the loop uses the last pointer position. After each scroll it updates the target. Only the window scrolls; the editor has no scroll container of its own.

**The spike's drag test helper moves to `/sheet-editor`.** `dragLabel` in `apps/web/e2e/spike-editor.spec.ts` drives a drag on desktop and phone emulation. A copy goes into `sheet-editor.spec.ts`. `moveChord` with an index gets Vitest tests.

## Risks / Trade-offs

- [Until chord-layout lands, a pile's later labels sit over the letters after it, so those letters can't be drop targets.] → Ctrl+K still adds a chord there. chord-layout removes the overlap.
- [Pointer drag on iPhone is untested, as for the rest of the editor.] → Accepted in the roadmap. Check by hand on the preview link.
- [Scrolling on phones may fight the browser's own scrolling.] → Labels keep `touch-action: none`, so the browser doesn't scroll during a drag.
