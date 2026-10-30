# Tasks

## 1. The model

- [x] 1.1 In `packages/chordsheet`, add `ChordMark` (`"held" | "optional"`) and `MarkedChord`, and make the sheet's `Chord` extend `MarkedChord`. Verify with `just typecheck`
- [x] 1.2 In `check.ts`, report a chord whose `mark` is set to anything but `held` or `optional`. Verify with tests in `check.test.ts` for a held chord, an optional chord and the mark "maybe"
- [x] 1.3 Add `readMarkedChord` and `writeMarkedChord`: `(…)` is held, `[…]` is optional, the inside goes through `readChord` and `writeChord`, and brackets that don't match are refused. Spaces around the inside are ignored. Verify with tests for `(Bb-7)` → `(Bbm7)`, `[ G7 ]`, `(C]` and `C(b5)`-style inner brackets such as `(Dmin7(b5))`
- [x] 1.4 Check that `transposeChord` keeps the mark and `guessKey` counts marked chords. Verify with tests for a held C moved from G to A, and a key guessed from marked chords

## 2. The import

- [x] 2.1 In `ultimate-guitar.ts`, accept a chord in round brackets as a word of a chord line, and mark it in one pass over the classified lines, before grouping: held when the chord before it has the same root, suffix and bass, optional otherwise. Verify with tests in `ultimate-guitar.test.ts` for the scenarios "Held into the chorus", "Optional chord", "Only a chord in brackets", a bracketed chord first in the sheet, and that `(x2)` is still a repeat count

## 3. The editor

- [x] 3.1 In `packages/chord-editor`, make the editor's `Chord` extend `MarkedChord` and have `symbolOf` keep `mark`. Verify with an adapter test that a sheet with a held and an optional chord is handed back unchanged, and a chord test that moving a held chord keeps its mark
- [x] 3.2 Show the label with `writeMarkedChord` in `chord-layer.ts`. Verify with a test that a held C's label is "(C)"
- [x] 3.3 In `apps/web/app/editor/sheet-editor.tsx`, read the chord input with `readMarkedChord` and fill it with `writeMarkedChord`. Verify with an e2e test in `sheet-editor.spec.ts` for the scenarios "Held chord", "Optional chord" and "Brackets that don't match"
- [x] 3.4 Show marks in `apps/web/app/home/sample-sheet.tsx` with `writeMarkedChord`, and verify with `just test`
- [x] 3.5 Check by hand with the `browser-check` skill: import a pasted Ultimate Guitar sheet with `(C)` at the start of a chorus, and type `[G7]` into the chord input

## Workflow follow-up

- Archive the change after review.
