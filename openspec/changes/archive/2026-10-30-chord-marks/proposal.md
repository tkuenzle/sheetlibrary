# Proposal

## Why

Ultimate Guitar sheets write a chord in round brackets, such as `(C)`. Most often it means the chord is still sounding at the start of a line or section. Sometimes it means a chord you may play or leave out. The import (#47) can't read either, so the whole chord line becomes lyrics. Our sheets have no way to show these chords at all (#62).

## What Changes

- A chord can be marked as held or as optional. A chord has at most one mark.
- The chord input reads `(C)` as a held C and `[C]` as an optional C. The text inside the brackets is read as any other chord, and spaces around it are fine: `( C )`. The chord label shows the mark the same way, around the chord's canonical form: `(Bbm7)`, `[C]`.
- The Ultimate Guitar import reads a chord in round brackets as held when the chord before it, in reading order and across sections, is the same chord. Otherwise it is optional. "The same" means the same root, suffix and bass.
- Transposing moves a marked chord like any other and keeps its mark. Marked chords count when the sheet's key is guessed.

ChordPro export (#37) will write both marks with round brackets. That is noted on #37 and is not part of this change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `chord-sheet-model`: a chord can hold a mark, `held` or `optional`, and the check refuses any other value.
- `chord-editor`: the chord input reads `(…)` and `[…]`, and the label shows them.
- `ultimate-guitar-import`: chords in round brackets count as chords on a chord line, held or optional by the chord before them.
- `transposition`: the mark stays when a chord moves, and marked chords count when the key is guessed.

## Impact

- `packages/chordsheet`: the `Chord` type, the check, reading and writing a chord with its mark, and the import.
- `packages/chord-editor`: the editor's `Chord` keeps the mark through edits, moves and the adapter. The chord label shows it.
- `apps/web`: the chord input reads the brackets. The sample sheet on the home page shows marks too.
- Content stays at version 1. Nothing is stored yet, and a chord without a mark reads as before.
