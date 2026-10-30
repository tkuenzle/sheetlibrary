# Design

## Context

`ChordSymbol` (root, suffix, bass) is what `readChord` and `writeChord` handle, and what the check and `transposeChord` work on. The sheet's `Chord` adds `at` to it. The editor's `Chord` adds `id`, and its `symbolOf` copies only root, suffix and bass, so any other field is lost on a change, a move or in the adapter.

## Decisions

**The mark lives on the chord, not in `ChordSymbol`.** A mark says how a chord is played in the song, not how it is spelled. `readChord`, `writeChord` and the suffix check stay as they are. A new `ChordMark` type (`"held" | "optional"`) and an optional `mark` go on a `MarkedChord = ChordSymbol & { mark?: ChordMark }`, which the sheet's and the editor's `Chord` extend. The other choice was to add `mark` to `ChordSymbol`. That would make every symbol carry something only a sheet needs, and `readChord` would have to read brackets in places that don't want them, such as the suffix check.

**Bracket text is read and written in one place.** `chordsheet` gets `readMarkedChord(text)` and `writeMarkedChord(chord)`. They take off or add `()` or `[]` and use `readChord` and `writeChord` for the inside. The chord input, the chord label and the sample sheet use them. The import doesn't: it only reads round brackets and decides the mark by its own rule.

**The editor keeps the mark.** `symbolOf` copies `mark` too, so changing, moving and handing back a chord keep it.

**The import marks chords in text order, before grouping.** After each line is classified, one pass goes through the chord lines in order, remembers the last chord, and marks each bracketed chord. Grouping into sections and repeating empty headers come after, so a repeated chorus copies chords that are already marked.

## Risks / Trade-offs

- [A held chord whose chord before it is changed later stays held.] → Fine for now. The mark is the user's to change, as on paper.
- [`N.C.` between two chords doesn't stop a hold.] → Left out on purpose. It is rare.
