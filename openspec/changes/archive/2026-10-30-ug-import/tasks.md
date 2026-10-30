# Tasks

## 1. Reading Ultimate Guitar text

- [x] 1.1 Add `get-east-asian-width` to `packages/chordsheet` and verify `pnpm install` and `just typecheck` pass
- [x] 1.2 Add `src/ultimate-guitar.ts` with the line classifier: blank, header, tab, chord line (with `|`, `N.C.` and repeat counts) and lyrics; verify with tests for `|G   |D   |`, `Am I wrong`, `Forever rejoice`, `e|---3---|` and `Capo: 2nd fret`
- [x] 1.3 Put chords on the lyrics below by column through the width map, and build lines of chords only with the repeat count after them; verify with tests for "Amazing grace", the `Eb  Eb/D` line over wide gaps, the CJK line and `D A Bm G x2`
- [x] 1.4 Group lines into sections: headers start labeled sections, cut to the label limit; blank lines split; empty headers repeat their earlier group; each section cleaned up and empty ones left out. Verify with tests for each scenario in the `ultimate-guitar-import` spec
- [x] 1.5 Export `readUltimateGuitar` and add a test that a full sheet copied from Ultimate Guitar, and odd text such as only blank lines, give sheets that pass `checkSheet`; verify with `just test`

## 2. The import on `/editor`

- [x] 2.1 Add an icon for the import to `apps/web/app/ui/icons.ts`, saved as the file's comment says, and verify `just typecheck` passes
- [x] 2.2 Build `ImportDialog` in `apps/web/app/editor/`: a modal `<dialog>` with the field, the note that the sheet is replaced, Cancel and Import; Escape, Cancel or a click outside closes it and focus goes back to the button. Verify with a component test like `key-button.test.tsx`
- [x] 2.3 Put the button in the top bar on `/editor`, and on import remount `SheetEditor` with the new sheet, set the original key from its chords, and count the import as edited for the leave warning; verify with the browser-check skill on a wide window and a phone
- [x] 2.4 Add e2e tests in `apps/web/e2e/editor.spec.ts` for cancelling, importing a verse and leaving after an import, and verify with `just e2e`
- [x] 2.5 Add the button's name, the dialog's title, field label, note and buttons to `docs/ui-text.md`, and verify with `just fmt-check`

## Workflow follow-up

- Try the import with sheets copied from Ultimate Guitar in Chrome, Safari and Firefox, and add fixtures for what they give.
- Archive the change after review.
