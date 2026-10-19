# Proposal

## Why

The editor from M2b edits one section, but a song has several. Users need to edit a whole sheet, start new sections and join them, with undo across sections. This is M2c in `docs/roadmap.md`. It also answers the roadmap's open question on undo across sections and pasting text with blank lines.

## What Changes

- The editor edits a whole sheet in one editor. Sections are part of the editor's document, so one undo history covers them all.
- The section with the caret is the active one. Other sections are dimmed but not locked: clicking or moving the caret into one makes it active. Only the active section's chords can be clicked; a click on another chord makes its section active. A selection stays inside one section.
- When the caret leaves a section, the section is cleaned up: empty lines are dropped, and an emptied section is removed. Escape or a click outside the sheet ends editing. Opening the chord input does not.
- A blank line is a section break. Enter on an empty line splits the section there, and pasted text with blank lines becomes several sections.
- Backspace at the start of a section joins it with the one before.
- Undo works across sections. One undo brings back a section that clean-up removed, together with its text.
- The editor hands back the whole sheet, cleaned up and checked by the model.
- The test page `/section-editor` becomes `/sheet-editor` and edits the whole seed song.
- `docs/roadmap.md`: reordering moves out of M2c into a new step, M2e section operations (dragging sections to reorder them), after chord interactions. Publish becomes M2f and UI polish M2g. The open question on undo and pasting is answered.

Out of scope: reordering and dragging sections (M2e), chord interactions (M2d), publishing.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `chord-editor`: the editor edits a whole sheet instead of one section, with an active section, clean-up when leaving it, blank lines as section breaks, joining sections and undo across sections.

## Impact

- `packages/chord-editor`: the schema gets a section node, the adapter loads and hands back a whole sheet, the rescue plugin finds lines one level deeper, and new plugins and commands handle the active section, clean-up, splitting and joining.
- `apps/web`: the React wrapper edits a sheet, the test page moves to `/sheet-editor`, and the Playwright tests follow.
- `packages/chordsheet` does not change.

## Open Questions

- Enter on an empty line that is the first line of a section, for example in a new section: split, or do nothing?
- Delete at the end of a section: join it with the next one, as the opposite of Backspace?
- Do sections need a label (verse, chorus), and does it belong in M2e?
