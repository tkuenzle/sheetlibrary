# Tasks

## 1. Reading and writing chords

- [x] 1.1 Add `readChord` and `writeChord` to `packages/chordsheet` with the slot table from the design: the root and bass read greedily in any case with `#`, `♯`, `b` and `♭`, the suffix slots in order with brackets dropped, English names only. Verify with unit tests for each spec scenario of `chord-symbols`, a list of chords taken from real Ultimate Guitar sheets, and a round trip: reading the written text gives the same chord
- [x] 1.2 Apply the design's one-form rules, and verify each with unit tests: `7add9` → `9` but `7add11` stays; `6/9`, `69`, `m69` and `C6/9/E`; `2` → `add9`; `aug7`, `+7`, `aug(maj7)`, `aug9` and `augadd9`; `dim7` stays, `dim9` is not a chord; `Cmsus4` is not a chord; `C/C` → `C` but `C/B#` stays; `7#9#5` → `7#5#9`, `7sus4(b9)` → `7sus4b9`; `C#5` is a C♯ power chord and `C+5` is `Caug`

## 2. Storing chords as parts

- [x] 2.1 Make `Chord` in `packages/chordsheet/src/sheet.ts` `{ at, root, suffix?, bass? }`, keeping version 1, and make the test helpers read chord text with `readChord`, throwing when it isn't a chord; verify with `just typecheck` and the existing tests
- [x] 2.2 Make `checkSheet` report a chord whose root or bass isn't a spelled note or whose suffix isn't canonical, instead of empty chord text; verify with tests in `check.test.ts` for the root "H", the suffix "min7" and the bass "C" on the root "C"
- [x] 2.3 Rewrite the seed song's chords in the new shape and make the home page's sample sheet show them with `writeChord`; verify with `seed-song.test.ts` and `sample-sheet.test.tsx`

## 3. Chords in the editor

- [x] 3.1 Give the editor's chord the same parts with an id, make `insertChord` and `changeChord` take a chord symbol, and copy the parts both ways in the adapter; verify with an `adapter.test.ts` round trip of a sheet with a suffix and a bass
- [x] 3.2 Make the chord layer's labels use `writeChord`; verify with the existing chord layer e2e tests

## 4. The chord input in the app

- [x] 4.1 Read the text with `readChord` on Done in `sheet-editor.tsx`. When it isn't a chord, keep the input open and show a `Note` under the field, with `aria-invalid` and `aria-describedby` on the input, and hide the note when the text changes. Open an existing chord with its written text. Keep the empty-text behavior. Verify with e2e tests in `apps/web/e2e/sheet-editor.spec.ts` for "Bb-7" showing "Bbm7" and opening as "Bbm7", "N.C." keeping the input open with the note, and Cancel closing it
- [x] 4.2 Add the note's words to `docs/ui-text.md` and verify with `just fmt-check`

## Workflow follow-up

- Open an issue for "N.C." (no chord): Ultimate Guitar sheets use it, and it means the band stops playing until the next chord.
- Update issue #45 with the decisions: parts, canonical form, own parser, no "N.C.".
- Archive the change after review.
