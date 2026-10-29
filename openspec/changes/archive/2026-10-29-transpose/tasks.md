# Tasks

## 1. Keys in the model

- [x] 1.1 Add `packages/chordsheet/src/keys.ts` with the `Key` type (`{ tonic, minor }`) and `keysToMoveTo(minor)`, the twelve cells with both keys at the tie; verify with tests for the major and minor lists in `keys.test.ts`
- [x] 1.2 Add `transposeChord(chord, from, to)`, which moves root and bass by the spelled interval, falls back to one accidental on the new key's side, and keeps the suffix; verify with tests for G to Bb, G/B to A/C#, F in G to G in A, and G# to Ab with Fm staying Fm
- [x] 1.3 Add `stepKey(key, ±1)`, landing on the listed key and on F# or Ebm at the tie; verify with tests for G down, F up and Em down
- [x] 1.4 Add `guessKey(chords)`, scoring all 24 keys and keeping the sheet's spelling of the tonic, `null` without chords; verify with tests for "Amazing Grace" (G), a G# sheet, "Greensleeves" (Em), G-C-D (G), and that a moved sheet is guessed in the new key

## 2. Transposing in the editor package

- [x] 2.1 Add `chordsIn(doc)` and the `transposeChords(move)` command to `packages/chord-editor/src/chords.ts`, replacing every chord in one transaction with ids and selection kept; verify with `chords.test.ts` tests that the chords move and one undo brings them back
- [x] 2.2 Add `setChordsById(chords)`, which sets chords by id in one transaction and skips ids that are gone; verify with a unit test

## 3. The key button and panel in the app

- [x] 3.1 Give `SheetEditor` an `onChordsChange` option and `transpose`, `restoreChords`, `undo` and `redo` on its handle; verify with `just typecheck` and the e2e tests in 3.4
- [x] 3.2 Build the key button and panel in `apps/web/app/editor/`: a `<dialog>` under the button, a bottom sheet on a phone; the cells, the split cell, the steps and "Back to G"; the current key marked with `aria-pressed`; the panel stays open after a pick; Escape, a click outside or the button closes it and focus goes back to the button; Ctrl Z, ⌘ Z and redo run in the editor. Verify with a component test like `section-toolbar.test.tsx`
- [x] 3.3 Put the button beside the heading on `/editor`, marked `data-keeps-editing`, hidden without chords, guessing the key from `onChordsChange`; style it after the "Transpose" page of the design canvas with looser spacing, and verify with the browser-check skill on a wide window, a tablet and a phone
- [x] 3.4 Add e2e tests in `apps/web/e2e/editor.spec.ts` for the spec's scenarios (seed song in G, no chords, picking A, stepping, Ctrl Z in the panel, "Back to G") and verify with `just e2e`
- [x] 3.5 Add the key button's name, "Transpose to", "G is guessed from the chords.", the step names and "Back to G" to `docs/ui-text.md`, and verify with `just fmt-check`

## 4. Review feedback

- [x] 4.1 Slide the phone sheet out before it closes, and verify with an e2e test on the phone project
- [x] 4.2 Center "One semitone" between the steps; the label's rule also matched the tooltip wrappers. Verify in the browser
- [x] 4.3 Name the original key in the panel and make "Back" move to it, always shown and disabled in it; drop `setChordsById`. Verify with the component tests and the e2e test for "Back" after reopening

## Workflow follow-up

- Comment on #46 that the key is guessed until #58.
- Archive the change after review.
