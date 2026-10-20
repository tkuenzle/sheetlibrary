# Proposal

## Why

Chords can be added only with Ctrl+K or Cmd+K at the text caret, and a letter that already has a chord can only get another one by dragging. Adding chords by mouse should be direct. This is the fourth part of M2d in `docs/roadmap.md`.

## What Changes

- In the active section, hovering in the band below the lyrics shows a "+" under the letter at the pointer. Spaces and the end of a line count as spots.
- While the "+" shows, a caret in front of the letter, in the lyrics, shows where the chord will land.
- The active section has a bit more line height, so the "+" has room below the lyrics.
- Clicking the "+" opens the chord input at that letter. The text caret stays where it was, and editing doesn't end.
- Under a letter that already has chords, the new chord goes after them. Their order is changed by dragging.
- Adding a chord is one undo step. Undo now removes an added chord, also one added by keyboard, and redo deletes a deleted chord again.
- Over the lyrics themselves, clicking places the caret as before. Labels keep their grab and click behavior.
- `docs/roadmap.md`: chord-add is marked done, with the approach: the "+" sits below the lyrics, so it never overlaps labels and adds to piles. A new change, touch-add, is added to M2d: on phones, the native caret or selection, with its magnifier, picks the letter, and a "+ Chord" button opens the chord input. An "Add after" button in the chord input could add to a pile by keyboard and touch. Dragging a "+" onto a letter is the fallback if this feels clumsy. Try it on an iPhone first.

Out of scope: adding on phones (touch-add), adding by dragging, and an "Add after" button in the chord input.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `chord-editor`: chords can be added by mouse, with a "+" below the lyrics.

## Impact

- `packages/chord-editor`: the chord layer shows the "+" and the preview, and finds the letter with `letterAt`. The rescue skips undo and redo. The stylesheet gets the "+" and the active line height.
- `apps/web`: the sheet editor opens the chord input from the "+". The Playwright tests for `/sheet-editor` cover it on desktop.
- `docs/roadmap.md`: as above.

## Open Questions

- Moving a chord by keyboard, for people who can't drag?
- With the chord input open, does a click below another letter move the input there without saving, as starting a drag closes it?
- Should a pen that can hover get the "+" too?
