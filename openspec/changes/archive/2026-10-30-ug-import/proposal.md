# Proposal

## Why

Most songs people play are already on Ultimate Guitar, and typing them in again is the biggest hurdle to using the library. Chords are parsed since `chord-parsing` and sections have labels since `section-labels`, so text copied from Ultimate Guitar can now become a sheet: chords on the right letters, sections with their names.

## What Changes

- `/editor` gets an "Import from Ultimate Guitar" button. It opens a dialog with a field to paste text copied from an Ultimate Guitar page.
- Importing replaces the sheet on the page. The dialog says so. The import can't be undone; the title stays "Amazing Grace" until sheets have titles (#48).
- A line is a chord line when every word on it is a chord, a bar `|`, a repeat count such as `x2`, or `N.C.`, and at least one word is a chord. Its chords go on the letters of the lyrics line below, by column. Wide letters, such as Chinese or Japanese, count as two columns. A chord line without lyrics below becomes a line of chords only, and keeps its repeat count as text after the chords.
- A line such as `[Verse 1]` starts a section with that label. A header with no lines under it, such as a second `[Chorus]`, repeats what the earlier `[Chorus]` started. A blank line starts a new section without a label, as pasting does in the editor.
- Tab lines, such as `e|---3---|`, are dropped. Other lines are kept as lyrics, including `Capo:`, `Key:` and `Tuning:` lines, until sheets can hold them.
- The import is a function in `chordsheet`, so more formats (ChordPro, #37) and the library (M4) can add their own way in. The editor needs no new API: the page loads the imported sheet as it loads the seed song.

Importing from a URL is #38. Importing from other formats is #37.

## Capabilities

### New Capabilities

- `ultimate-guitar-import`: reading text copied from Ultimate Guitar into a chord sheet.

### Modified Capabilities

- `editor-page`: the import button and dialog, and the warning before leaving after an import.

## Impact

- `packages/chordsheet`: the Ultimate Guitar reader and its tests.
- `apps/web`: the import button, the dialog, loading the imported sheet on `/editor`, and an icon.
- `apps/web/e2e`: tests for the import.
- `docs/ui-text.md`: the words for the button and the dialog.

## Open Questions

- A repeat count on a chord line with lyrics below, such as `G  D  x2`: drop it, or add it at the end of the lyrics?
- A header with no lines and no earlier section of that label: drop it? Should "Chorus" match "chorus"?
- Tab characters in pasted text: count them as spaces up to the next multiple of 8?
- Should the dialog say what was dropped, such as "4 tab lines removed"?
- Pasted text that gives an empty sheet, such as only tab lines: disable Import, or import an empty sheet?
- There is no mockup for the button and dialog yet.
