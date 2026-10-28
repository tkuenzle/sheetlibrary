# Proposal

## Why

Songs have parts: verse, chorus, bridge. Today a section only has a number from its position. The Ultimate Guitar import (#47) needs somewhere to put headers like `[Verse 1]`, and people want to name their own parts.

## What Changes

- A section can have a label: free text, such as "Chorus" or "Verse 2". The chord sheet model stays at version 1 and gets an optional `label` on a section. Nothing is stored yet, so no content breaks.
- Each section shows its label above its lyrics, inside the section, at every width. A section without a label keeps the empty row, so its lyrics don't move when it becomes active.
- The number badges go away. The active section without a label shows "Add label" instead.
- Clicking or tapping the active section's label, or "Add label", turns it into a text field in the same place. Suggestions show below: Intro, Verse, Pre-chorus, Chorus, Bridge, Solo, Outro. Typing narrows them. Enter, a click elsewhere or a suggestion keeps the label; Escape cancels; an empty field removes the label.
- A click on another section's label only makes that section active.
- Ctrl+Shift+L, or ⌘⇧L, opens the label field from the keyboard, and the help lists it. When the field closes, the cursor is back where it was.
- Labels are cleaned up like lyrics: spaces at the ends go, runs of spaces become one, and a label left empty is removed. A label has at most 40 characters and no line breaks.
- Screen readers read the label, such as "Chorus", before the section's lyrics. A section without a label has nothing read before its lyrics.
- Joining two sections keeps the label of the first, even when it has none; the second label is dropped. Splitting a section leaves the new section without a label.
- The seed song's sections are labeled "Verse 1" and "Verse 2".
- The app holds the words: "Add label", the field's name and the suggestions.

Repeats like "Chorus x2", reusing a chorus without copying it, and labels from pasted text are not part of this change. Pasted `[Chorus]` headers come with the import (#47). The home page's sample sheet keeps its badge for now; a separate issue will cover it.

The mockups are on the "Section labels" page of the design canvas.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `chord-sheet-model`: a section can have a label, which is checked and cleaned up.
- `chord-editor`: sections show and edit their labels, also by keyboard; the number badges are removed; joining and splitting say what happens to labels.
- `editor-page`: the seed song has labels, and the help lists the label shortcut.
- `ui-text`: the package's words for labels come from the app, as the badge's word did.

## Impact

- `packages/chordsheet`: the `Section` type, `checkSheet` and `cleanUpSection`.
- `packages/chord-editor`: the section node gets a label, drawn by the package in a row above the lyrics; the badge counter goes; split, join and the adapter handle labels; the app is told where to open the label field.
- `apps/web`: the label field with its suggestions, the label styles, no badge styles, the seed song, the help.
- `apps/web/e2e`: tests for labels; badge tests go.
- `docs/`: `design-direction.md` (no badges, labels above the lyrics) and `ui-text.md` (the label words, the glossary's note on "verse" and "chorus").
