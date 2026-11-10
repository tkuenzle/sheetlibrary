# Proposal

## Why

The home page's sample sheet is static markup that only works for simple lines: one chord per letter, none on a space (#23). The play view (#31), lyrics only (#96) and printing will need a real read-only view. Print has to be clean: chords stay with their lyrics across pages, and the lyrics get no space the chords don't need.

## What Changes

- A read-only sheet view renders a sheet from the model as HTML and CSS on the server. It needs no JavaScript and no ProseMirror. The editor is not changed, and the view does not have to look the same as it.
- Chords sit in the text flow. The lyrics get extra space only where a chord would run into the next one. A chord inside a word that needs space gets a dash of at least 0.6em, never a tiny gap. Several chords on one letter, and a chord on a space, push the next letter past their names.
- Every line keeps its chord row, also when it has no chords and on the rows of a wrapped line. A line of chords only has no empty lyrics row.
- The space a chord needs is worked out from a table of the font's letter widths, made by a build script from the font files.
- The home page's sample sheet uses the view and shows the first section of the seed song with its label, "Verse 1". The number badge goes (#54).
- Not in this change: a shown key or capo, print styles and the play view (#31), lyrics only (#96), scripts other than Latin.

## Capabilities

### New Capabilities

- `sheet-view`: a read-only view of a sheet, with chords above the lyrics, for reading and printing.

### Modified Capabilities

- `home-page`: the sample sheet is the first section of the seed song, with its label, shown with the sheet view.

## Impact

- `apps/web/app/sheet-view/`: new. The layout, the view component, its styles and the width table.
- `apps/web/scripts/`: a script that writes the width table from the font files. New dev dependencies `fontkit` and `wawoff2`.
- `apps/web/app/home/sample-sheet.tsx` and its styles: use the view. The static pieces go.
- `apps/web/harness/`: a page of test sheets for the view's e2e tests.
- `packages/chord-editor` and `packages/chordsheet`: no change.
- Issue #23 describes a view built from the editor's chord layer. Its text gets updated to this approach.

## Open Questions

- A chord name wider than the whole line, on a very narrow screen, overflows the line. Is that acceptable?
- Right-to-left lyrics are untested.
- In dark mode, printing would use light text. Print styles belong to #31, but should they force the light style?
- Scripts other than Latin, as a later issue: Greek and Cyrillic need a font and table entries, Arabic and similar scripts need real shaping.
