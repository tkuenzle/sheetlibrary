# Proposal

## Why

Photo import (#93) asks a vision model for the song in a format that looks like ChordPro, because its chords are inline and models are bad at counting columns. The spike (`docs/photo-import-spike.md`) showed the answers are good. Now something has to turn them into a chord sheet.

## What Changes

- The photo answer is an internal format. It is never stored and may drift away from ChordPro. It carries only what a chord sheet can hold. When chord sheets gain something, such as comments or repeats, the format can follow.
- `readPhotoAnswer(text)` in `chordsheet` turns an answer into a chord sheet, with the title and artist for the envelope. Any text gives a valid sheet.
- Chords sit inline, as in `A[D]mazing`. `[(C)]` is a held chord and `[[C]]` an optional one, the same notation the app uses inside the brackets. A chord that can't be read, such as `[N.C.]`, is dropped.
- `{start_of_…: label}` and `{end_of_…}` make sections, with the label as written. The type, such as verse or chorus, is not kept. Blank lines are ignored.
- `{comment}`, `{composer}`, `{lyricist}` and every other directive are dropped.
- The prompt moves from the spike notes into `chordsheet`, next to the reader, so a format change touches both in one PR. It changes to match the reader:
  - No comments, composer or lyricist.
  - `[[C]]` for optional chords.
  - Plain repeats written out in full, with `x2` allowed at the end of a line of chords only.
  - Spoken words as plain lines.
- These prompt edits are not run in this change. #93 or #102 checks them on the spike songs.

No change in the app. Importing ChordPro files in the library is #98. Export is #74.

## Capabilities

### New Capabilities

- `photo-answer-format`: the format a vision model answers in for photo import: the prompt that asks for it, and reading it into a chord sheet.

### Modified Capabilities

None.

## Impact

- `packages/chordsheet`: the reader, the prompt and their tests.
- `docs/photo-import-spike.md`: a pointer to where the prompt lives now.

## Open Questions

- A title longer than 100 characters: cut it, as labels are cut to 40?
- An answer without `{title}`: the reader gives no title, and #93 decides what to show. Is that enough?
- Short forms such as `{soc}` and `{eoc}`: read them too, in case the model uses them, or only the long forms the prompt asks for?
- The function name `readPhotoAnswer`, and the name of the prompt export.
