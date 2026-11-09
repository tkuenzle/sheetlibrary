# Tasks

## 1. Keys in the address

- [x] 1.1 Add `readKey` to `packages/chordsheet/src/keys.ts`. It reads "A" or "F#m" and returns a key only if it is one of `keysToMoveTo` for the given mode. Verify with unit tests for a fit, a wrong mode, "G#" and "H".

## 2. Chord layer shows a key

- [x] 2.1 Give the chord layer a shown `{ from, to }` in its plugin state, set by a meta-only transaction, and write labels through `transposeChord`. Verify with a chord-editor test: labels read moved, and the doc is unchanged.
- [x] 2.2 Remove the `original` doc attribute and `originalKeyOf`. Change `setKey` to set the key only. Make `transposeChords` clear the shown key in the same transaction. Verify with tests in `chords.test.ts` and `adapter.test.ts`.

## 3. Shown key in the pages

- [x] 3.1 In `useSheetKey`, keep the shown key and drop `original` and `firstGuess`. A song key change keeps the distance, spelled from `keysToMoveTo`. Verify with `sheet-title.test.tsx`: setting Em while shown in A gives F#m.
- [x] 3.2 In `SheetEditor`, take the shown key as a prop, pass it to the layer, and move chords into the shown key for the chord input and back on commit. Verify with an e2e test for "Adding a chord in A".
- [x] 3.3 In `KeyButton`/`KeyPanel`: picks, steps and "Back" set the shown key. Add "Make A the song key" next to "Back". Disable "Change" and "Make" when read-only. Verify with `key-button.test.tsx`.
- [x] 3.4 In `sheet.tsx` and `editor.tsx`, read `?key` once, write it with `history.replaceState`, and remove a key that doesn't fit. Keep the key button on a read-only sheet. Verify with e2e tests for reload in A, leaving after steps, and `?key=Am`.

- [x] 3.5 While transposed, fill the key button with the accent colour and add the distance, such as "Key A · +2", read as "Key A, 2 semitones up". Verify with `key-button.test.tsx` and an e2e test for "Transposed".

## 4. Saving

- [x] 4.1 Verify in `e2e/sheet.spec.ts` that a transpose keeps "Saved" and the sheet opens from the library in G, that "Make A the song key" saves, and that a sheet read-only after a conflict still transposes.
- [x] 4.2 Update the existing key panel tests in `e2e/editor.spec.ts` for the new song key, "Back" and undo behaviour. Verify the e2e suite passes.
