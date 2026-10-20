# Proposal

## Why

A pile's later labels and a chord on a space sit over letters that aren't theirs, so it's unclear where the chords belong, and those letters can't take a dragged chord. Removing a chord at the end of a line leaves a trailing space that ends up in the stored sheet. Labels are placed one frame after each change, so the lyrics can jump. This is the second part of M2d in `docs/roadmap.md`.

## What Changes

- After a pile, the next letter starts past the pile's last label.
- After a chord on a space, the next word starts past the chord's label. No dash.
- A single chord on a letter that isn't a space is laid out as before: its label may reach over the next letters, and only the next chord is pushed.
- Wherever labels push two letters of a word apart, by a pile or by long labels on letters close together, the gap shows a dash and is at least 0.6em wide.
- A click or tap in a gap puts the caret between the two letters, drawn where typed text appears.
- Cleaning up a line trims spaces at both ends and collapses runs of spaces inside it. A space that holds a chord is always kept. A run without chords becomes one space; a run with chords keeps only those. Chord positions move with the text. This fixes the trailing space left by removing a chord.
- Labels are placed in the same frame as the change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `chord-editor`: piles and chords on spaces push the text after them, with a dash in a gap inside a word. The caret in a gap. Labels placed without delay. Finishing a section trims and collapses spaces.
- `chord-sheet-model`: cleaning up a section also trims and collapses spaces in each line, keeping spaces with chords.

## Impact

- `packages/chord-editor`: the chord layer lays out piles and chords on spaces, draws the dashes, places the caret in a gap, and renders right after each change. The editor's section clean-up drops the same spaces as the model.
- `packages/chordsheet`: the clean-up trims and collapses spaces and moves chord positions.
- `apps/web`: Playwright tests for `/sheet-editor` cover piles, chords on spaces, dashes, clicks in a gap, and how often an edit on a long song lays out the page.
