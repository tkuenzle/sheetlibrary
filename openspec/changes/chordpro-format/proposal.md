# Proposal

## Why

Most chord sheets people already have exist as text, and ChordPro is the most common open format for them. The chord sheet model (`chord-sheet-model`) is the source of truth, so formats are views of it: import and export may lose what the other side can't hold. ChordPro is the first format, and more will follow, so import and export share a common shape.

## What Changes

- A common interface for formats in `packages/chordsheet`: a name, import from text to a valid sheet, and export from a sheet to text. Shared helpers for all formats: building sections, NFC text, and dropping a chord that would sit between a letter and its accent.
- ChordPro import:
  - A chord in brackets sits at the position of the text that follows it.
  - Blank lines and the section directives `start_of_*` and `end_of_*` (and their short forms, such as `soc` and `eoc`) start a new section. Several in a row count as one.
  - Other directives and `#` comment lines are dropped.
  - Empty chords (`[]`) and chords between a letter and its accent are dropped.
- ChordPro export: chords in brackets before their text, piles in order, one blank line between sections. Text ChordPro can't hold is cleaned up, so the output is always plain ChordPro:
  - `[` and `]` in chord text are dropped; a chord left empty is dropped.
  - `[ ] { }` in lyrics are replaced with `( ) ( )`.
  - A `#` at the start of a lyric line and a `\` at its end are dropped.
- Checks for every format: an import gives a sheet that passes the model's check, and export then import gives back the cleaned-up sheet, for any sheet. Property tests generate random sheets with awkward characters.
- For ChordPro, the export is also read with an independent parser (ChordSheetJS) and must give the same lines and chords.

## Capabilities

### New Capabilities

- `sheet-formats`: what every import and export format guarantees: valid sheets on import, and a round trip that gives back the cleaned-up sheet.
- `chordpro-format`: reading and writing ChordPro.

### Modified Capabilities

None.

## Impact

- `packages/chordsheet`: new format code and tests.
- New dev dependencies, used in tests only: `fast-check` and `chordsheetjs`.
- No change to `apps/web`. The spike keeps its own ChordPro reader.

## Open Questions

- Does `{chorus}` (repeat the chorus here) also start a new section?
- Pango markup: the reference implementation may read `<` and `&` in lyrics as markup. Not verified.
- ChordPro 6 may read `\uXXXX` in lyrics as an escape. Not verified.
- Is a line with spaces before its `#` a comment or lyrics?
- Run the Perl reference implementation in CI too, or are the property tests and ChordSheetJS enough?
- Should formats be found by name or file extension (a registry), or is the interface enough for now?
