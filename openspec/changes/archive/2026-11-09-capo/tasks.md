# Tasks

## 1. Capo in the model

- [x] 1.1 Add `readCapo` to `packages/chordsheet/src/keys.ts`. It reads "3" and returns a fret from 1 to 9, or null. Verify with unit tests for "3", "0", "10", "12" and "x".
- [x] 1.2 Add a test in `keys.test.ts` that the shapes for capo 3 in Bb are G, and for capo 4 in Bb are F#, through `keyAbove(key, -capo)`. Verify the test passes.
- [x] 1.3 Add `readUltimateGuitarCapo(text)` to `packages/chordsheet/src/ultimate-guitar.ts`. `Capo: 2nd fret`, `Capo 2` and `Capo: 2` give 2; text without one, or with a fret above 9, gives null. Verify with tests in `ultimate-guitar.test.ts`, including that `readUltimateGuitar` still reads the same sheet.

## 2. Capo button

- [x] 2.1 Add a `CapoButton` beside the key button in `SheetTitle`, with the list from "No capo" to "Capo 9" and the shapes for each fret, a bottom sheet on a phone, and the styles from the canvas's Capo page. Verify with a `capo-button.test.tsx` for the labels, the marked fret and the shapes.
- [x] 2.2 In `useSheetKey`, keep the capo, and work out the key to draw in as `keyAbove(shown ?? song, -capo)`. Pass that key to `SheetEditor` in place of the shown key. Verify with `sheet-title.test.tsx` and an e2e test for "Capo 5" and "Capo after a transpose".
- [x] 2.3 In the `show` action of `sheetKeyReducer`, keep the shapes and move the capo where the new fret is from 1 to 9, drop it at 0, and keep it at 10 or 11. Verify with `sheet-title.test.tsx` and an e2e test for "Singer needs C" and "Shapes too far".
- [x] 2.4 Write `?capo` with `?key`, read it once in `sheet.tsx` and `editor.tsx`, and remove a capo that doesn't fit. Verify with e2e tests for "Reload with capo 5" and "Capo that doesn't fit".
- [x] 2.5 Verify with an e2e test for "Adding a chord with capo 5" that a chord typed as a shape is stored in the song key.
- [x] 2.6 Verify in `e2e/sheet.spec.ts` that a capo keeps "Saved" and the sheet opens from the library without a capo.
- [x] 2.7 Add the capo button's words to `docs/ui-text.md`, and verify they match the button's labels and names.

## 3. Import with a capo

- [x] 3.1 Add "Written for" to `ImportForm` in `import-button.tsx`. It follows `readUltimateGuitarCapo` as the text changes, until the person picks a value. Verify with `import-button.test.tsx`.
- [x] 3.2 On import, move the chords up from the guessed key by the capo, and pass the capo with the sheet. `/editor` shows the sheet with it. Verify with an e2e test for "Importing with capo 2".
- [x] 3.3 In `sheets.tsx`, open the imported sheet with `?capo=N`. Verify with an e2e test in `e2e/library.spec.ts` for "Importing with a capo".
- [x] 3.4 Add "Written for" to the import's words in `docs/ui-text.md`, and verify they match the form.

## 4. Check

- [x] 4.1 Check the capo button, the list and the import in a real browser, at desktop and phone width, with the `browser-check` skill. Compare with the canvas's Capo page.
