# Tasks

## 1. Suggestions in `chordsheet`

- [x] 1.1 Add `chordsOfKey(key)`, moved from the C major and A minor lists with `transposeChord`. Verify with tests for G major (`F#dim`, not `Gbdim`), F major (`Bb`) and A minor (both `Em` and `E`)
- [x] 1.2 Add `suggestChords(text, sheetChords, key)`: sheet chords by count and first use, then key chords, then the typed root with common suffixes, each once, matched by prefix as in design.md, each with whether the sheet has it. Verify with tests for the scenarios "Sheet chords, then the key" and "Narrowing and completing", plus `bb-7`, `dsu`, `(d`, `Am` → `Amaj7`, `d/` completing the bass, and a sheet without chords or key

## 2. Shared docking in `chord-editor`

- [x] 2.1 Move the docking code out of `section-toolbar.ts` into its own module: lifting by `coveredByKeyboard()`, hiding while the visible area moves, and keeping a box above the docked element. Export it for the app. Verify that the docked toolbar tests in `apps/web/e2e/sheet-editor.spec.ts` pass unchanged

## 3. The chord input

- [x] 3.1 Give `SheetEditor` a `sheetKey` prop and pass the page's key from `routes/editor.tsx`. Verify with `just typecheck`
- [x] 3.2 Lay out the input as on the canvas: field and Done, the preview line, the suggestion row, then Remove and Cancel. Verify that the existing chord input e2e tests pass
- [x] 3.3 Show the preview line, blank while the text isn't a chord. Verify with e2e tests for "Canonical form before Done" and "Halfway text", and that "Changes D to (Bbm7)" shows when editing D
- [x] 3.4 Show the suggestion row from `suggestChords`, with the outlined look, the legend and the hidden "not in this sheet yet". Verify with an e2e test for "A key chord" and that the row is built from the sheet and the key
- [x] 3.5 Make it a combobox like the label field: a click or tap picks, up and down choose, Enter picks the chosen one, and the typed mark stays. Verify with e2e tests for "Tap" and "Keeping the mark", and that Enter without a chosen suggestion still reads the text
- [x] 3.6 Dock the input with the shared module under the `compact` query, hide the docked section toolbar while it is open, and keep the letter above it. Verify with an e2e test for "Phone" on the phone project, and that the toolbar shows again after Done
- [x] 3.7 Check by hand with the `browser-check` skill on desktop and in a phone-wide window: add a chord by picking a suggestion, type `bb-7`, and edit a held chord. Note whether an iPhone was at hand for #43. Checked on desktop Chromium and Pixel 7 emulation; no iPhone was at hand

## Workflow follow-up

- Archive the change after review.
