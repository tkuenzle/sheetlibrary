## REMOVED Requirements

### Requirement: Editing one section
**Reason**: The editor now edits a whole sheet in one editor.
**Migration**: Replaced by "Editing a sheet".

### Requirement: Handing back a section
**Reason**: Sections are cleaned up when the caret leaves them, and the editor hands back the whole sheet.
**Migration**: Replaced by "Finishing a section" and "Handing back a sheet".

## ADDED Requirements

### Requirement: Editing a sheet
The editor SHALL edit all sections of a chord sheet in one place. It SHALL show the sections, lines and chords as stored, and hand back the same sheet when nothing was changed.

#### Scenario: Unchanged sheet
- **WHEN** a sheet with two sections, one ending with a chord after its last letter, is loaded and handed back without changes
- **THEN** the sheet has the same sections, text and chords as before

### Requirement: Active section
The section with the caret SHALL be the active section and SHALL look active. The other sections SHALL look dimmed but stay editable: moving the caret into one, by click or arrow key, makes it active. A selection SHALL stay inside one section.

#### Scenario: Arrow into the next section
- **WHEN** the caret is on the last line of the first section and the user presses the down arrow key
- **THEN** the caret is in the second section, and the second section is active

#### Scenario: Selection across sections
- **WHEN** the user drags a selection from the first section into the second
- **THEN** the selection ends at the end of the first section

### Requirement: Finishing a section
When the caret leaves a section, or editing ends, the section SHALL be cleaned up by the chord sheet model: empty lines are dropped, and a section left empty is removed. Escape and a click outside the sheet SHALL end editing. Opening the chord input SHALL NOT end editing.

#### Scenario: Empty line dropped
- **WHEN** a section has an empty line and the user clicks into another section
- **THEN** the empty line is gone

#### Scenario: Emptied section removed
- **WHEN** the user deletes all text of a section and presses Escape
- **THEN** the section is gone

#### Scenario: Chord input
- **WHEN** a section has an empty line and the user opens the chord input with Ctrl+K or Cmd+K
- **THEN** the section is still active and keeps its empty line

### Requirement: Blank line is a section break
Enter on an empty line SHALL split the section there: the empty line goes, and the lines after it start a new section with the caret. Pasted text with blank lines SHALL become one section per block of lines.

#### Scenario: Enter on an empty line
- **WHEN** the caret is at the end of the second of four lines and the user presses Enter twice
- **THEN** the section holds the first two lines, a new section holds the other two, and the caret is at the start of the new section

#### Scenario: Paste with blank lines
- **WHEN** the user pastes "a\nb\n\nc" into an empty sheet
- **THEN** the sheet has two sections: "a" and "b", then "c"

### Requirement: Joining sections
Backspace at the start of a section SHALL join it with the section before: its lines are added after that section's lines, and no lines are merged.

#### Scenario: Backspace at the start
- **WHEN** the caret is at the start of the second section and the user presses Backspace
- **THEN** the lines of both sections form one section, and the caret stays where it was

### Requirement: Undo across sections
Undo SHALL undo edits in any section, newest first, and make the section of the undone edit active. One undo SHALL bring back a section that clean-up removed, together with its text.

#### Scenario: Edits in two sections
- **WHEN** the user types in the first section, then in the second, and presses undo twice
- **THEN** both edits are undone and the first section is active

#### Scenario: Removed section
- **WHEN** the user deletes all text of a section, clicks into another section, and presses undo once
- **THEN** the section is back with its text

### Requirement: Handing back a sheet
The editor SHALL hand back the whole sheet, with every section cleaned up and the result checked by the chord sheet model, including the active section.

#### Scenario: Active section with an empty line
- **WHEN** the active section has an empty line and the sheet is handed back
- **THEN** the handed-back section holds no empty line

#### Scenario: Nothing left
- **WHEN** the user deletes all text in every section and the sheet is handed back
- **THEN** the handed-back sheet has no sections
