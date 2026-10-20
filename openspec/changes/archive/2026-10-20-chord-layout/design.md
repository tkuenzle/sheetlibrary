# Design

## Context

`render()` in `packages/chord-editor/src/chord-layer.ts` places labels in a frame after each change. It clears every chorded letter's `margin-left`, then sets it again where a label would run into the previous one. Only chorded letters can get a margin, because the text between them is plain text nodes.

## Decisions

**A gap is a right margin on the chorded letter.** For a pile, or a chord on a space, the letter's span gets `margin-right` so the next letter starts past the last label plus the usual spacing. The margin comes from widths only: the labels' widths and spacing, minus the letter's width. The text after the span is a plain text node, so it can't get a margin. A widget decoration as a spacer was rejected: it is an element without a position in the text, and phones handle the caret badly around those.

**Margins are written only when they change.** `render()` no longer clears margins first. For each chorded letter it works out the margin it needs and writes it only if it differs from the current one. While typing, usually nothing changes, so the layout is read once. This also stops a loop with the ResizeObserver: a second render writes nothing, so the size doesn't change again.

**Labels are placed right away.** `update()` and the ResizeObserver callback call `render()` directly instead of waiting for an animation frame. Both run before the browser paints.

**The chord layer draws the dashes.** Like the labels, a dash is an element in the layer, placed in the gap at the text's baseline. It shows in every gap between two letters of one word on the same row, whichever margin made it: a pile's right margin, or the left margin of a letter pushed clear of the labels before it. A gap between two chorded letters gets one dash. Such a gap is at least 0.6em wide (twice the spacing between labels), so the dash stays visible after a short push. The text node after the gap can't carry a pseudo-element, and the layer keeps everything visual out of the editable text.

**The caret in a gap is drawn where typed text appears.** Both sides of a gap are the same position in the text. After a pile or a chord on a space, the gap is the right margin of the letter before it, and typed text lands after the gap. In front of a pushed letter, the gap is that letter's left margin, typed text lands before it, and the browser already draws the caret there. For a right margin, the browser draws the caret at the end of the letter before the gap, though. So after each update, when the caret sits right after a letter with a gap, the chord layer moves the browser's caret to the start of the text after the gap. ProseMirror reads that as the same position and leaves it. It is skipped when the next letter has chords, since typing at the start of a chord's letter could give the chord to the typed text.

**The editor drops the same spaces as the model.** The model exports one function that finds the spaces to drop in a line: both ends, and all but one space of each run inside it, or all spaces without chords if the run has any. A space with a chord is never dropped. The model's `cleanUpSection` uses it on the text and moves chord positions. The editor's own section clean-up uses it on the editor's line and deletes those spaces, so chord marks move by themselves. The adapter keeps stripping the trailing space that carries end-of-line chords.

**A layout count guards the speed.** A Playwright test edits a long song with piles and chords on spaces, and checks with Chrome's own count that each edit lays out the page at most twice. A time limit was tried first, with the CPU slowed down 4 times, but it depends on the machine: about 3.5 ms per edit locally, 11 to 13.5 ms in CI. If the count goes up, the fallback is to lay out only lines whose node changed and move the other labels up or down. That was put off because ProseMirror may redraw a line without changing its node, which would leave stale margins.

## Risks / Trade-offs

- [A margin can wrap the next letter to a new row, which changes the row of later labels.] → Each render works in order along the line and reads positions after earlier writes, as today.
- [Rendering on each change forces a layout read per transaction.] → Writes only on change keep it to one in the common case. The layout count test checks it.
- [Caret and clicks in a gap are untested on iPhone.] → Accepted in the roadmap. Check by hand on the preview link.
