# Proposal

## Why

Right now a chord can only be moved by deleting it and adding it again. The spike (M1) showed that dragging a chord feels natural on desktop and on phones, so the editor should support it. This is the first part of M2d in `docs/roadmap.md`.

## What Changes

- The user drags a chord's label to move the chord to another letter. A caret shows where it will land. A tap or click still opens the chord for editing.
- Only the active section's chords can be dragged, and they can only be dropped there. Outside the active section the caret hides, and letting go puts the chord back.
- Over a pile (several chords on one letter), the caret appears between the labels, and the chord goes into that spot in the pile. This also reorders a pile. Elsewhere, the chord goes after the chords already on the letter.
- A move is one undo step. The text caret stays where it was. Escape cancels a drag.
- Starting a drag closes the chord input without saving it. Only one chord is dragged at a time; a second finger is ignored.
- The page scrolls while a chord is dragged near the top or bottom of the window.
- `docs/roadmap.md`: M2d is split into three changes. chord-drag (this one). chord-layout: a pile or a chord on a space pushes the text after it past its labels, the trailing space left after removing a chord is fixed, and labels are placed without the one-frame delay. chord-add: adding chords by pointer, with an icon on hover, a tap above a word, or dragging.

Out of scope: the layout fixes (chord-layout) and adding chords by pointer (chord-add).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `chord-editor`: chords can be moved by dragging, inside the active section, including into a spot in a pile, with the page scrolling during a drag.

## Impact

- `packages/chord-editor`: the chord layer gets the spike's pointer handling, the drop caret, the pile hit test and scrolling. A move command takes a letter and a spot in its pile. The stylesheet gets the drag styles.
- `apps/web`: the Playwright tests for `/sheet-editor` cover dragging on desktop and phone emulation.
- `docs/roadmap.md`: M2d is split as above.

## Open Questions

- Moving a chord by keyboard, for people who can't drag?
