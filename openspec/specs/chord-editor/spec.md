# chord-editor Specification

## Purpose

Lets musicians edit a chord sheet visually, one section at a time: chords appear above the lyrics, are added and edited by keyboard or by clicking them, and stay on their letters while the lyrics change.

## Requirements

### Requirement: Chords above their letters
The editor SHALL show each chord above the letter it belongs to. A chord wider than the lyrics under it SHALL NOT overlap the next chord; the lyrics are pushed apart instead.

#### Scenario: Wide chord
- **WHEN** "Cmaj7" sits on a letter and the next chord sits two letters later
- **THEN** both chords can be read and the lyrics between them are spread out

#### Scenario: Long line wraps
- **WHEN** a line is too long for the screen and wraps
- **THEN** every chord stays above its letter on the wrapped part

### Requirement: Adding and editing chords
The user SHALL be able to add a chord at the caret, and to edit and delete a chord, by keyboard. Clicking or tapping a chord's label SHALL open it for editing. Any chord text is accepted.

#### Scenario: Add by keyboard
- **WHEN** the caret is just before the "r" in "wretch" and the user presses Ctrl+K or Cmd+K and enters "Am"
- **THEN** "Am" appears above the "r"

#### Scenario: Delete a chord
- **WHEN** the user deletes a chord with the chord controls
- **THEN** the chord is gone and the lyrics are unchanged

### Requirement: Natural caret
Chords SHALL NOT add caret stops. Each arrow key press moves the caret by one letter, and typing never changes a chord's text.

#### Scenario: Arrow past a chord
- **WHEN** the caret is just before a letter with a chord and the user presses the right arrow key once
- **THEN** the caret is just after that letter

### Requirement: Chords stay on their letters
A chord SHALL stay on its letter when text before it is added or removed, and when its line is split or joined with another line.

#### Scenario: Text added before a chord
- **WHEN** "D" sits on the "A" of "Amazing" and the user types "So " before it
- **THEN** "D" still sits on the "A"

#### Scenario: Line split
- **WHEN** the user presses Enter before a word that carries a chord
- **THEN** the word and its chord move to the new line together

### Requirement: Chords are rescued
When the letter under a chord is deleted or replaced, the chord SHALL move to the nearest remaining letter, which is the start of the replacement if there is one. A chord is never removed by editing the lyrics, except when its whole line is deleted.

#### Scenario: Letter replaced
- **WHEN** "D" sits on the "a" of "grace" and the user selects "ace" and types "ound"
- **THEN** "D" sits on the "o" of "ground"

#### Scenario: Letter deleted
- **WHEN** "D" sits on the "a" of "Amazing" and the user deletes that "a"
- **THEN** "D" sits on the "z"

### Requirement: Several chords on one letter
When rescued chords land on the same letter, the editor SHALL keep all of them in their original order and show them side by side.

#### Scenario: Range deleted
- **WHEN** "C", "D" and "Em" sit on three words and the user deletes those words
- **THEN** "C D Em" sits on the next remaining letter, in that order

### Requirement: Deleting whole lines
When a whole line is deleted, its chords SHALL be deleted with it. A line counts as deleted only when it is gone completely; replacing all of its text keeps its chords.

#### Scenario: Line deleted
- **WHEN** the user selects a full line, including its line break, and deletes it
- **THEN** its chords are gone and no other line gets them

#### Scenario: Line text replaced
- **WHEN** the user selects all text of a line, but not its line break, and types new words
- **THEN** all of the line's chords sit on the first new letter, in order

### Requirement: Undo restores chords
Undo SHALL restore lyrics and chords to the state before the edit in one step. Redo SHALL repeat the edit, including any chord rescue.

#### Scenario: Undo a deletion
- **WHEN** the user deletes a letter that carries a chord and then presses undo once
- **THEN** the letter is back and the chord sits on it again

### Requirement: Editing a sheet
The editor SHALL edit all sections of a chord sheet in one place. It SHALL show the sections, lines and chords as stored, and hand back the same sheet when nothing was changed.

#### Scenario: Unchanged sheet
- **WHEN** a sheet with two sections, one ending with a chord after its last letter, is loaded and handed back without changes
- **THEN** the sheet has the same sections, text and chords as before

### Requirement: Active section
The section with the caret SHALL be the active section and SHALL look active. The other sections SHALL look dimmed but stay editable: moving the caret into one, by click or arrow key, makes it active. Only the active section's chord labels SHALL open for editing; a click on another label makes its section active. A selection SHALL stay inside one section.

#### Scenario: Arrow into the next section
- **WHEN** the caret is on the last line of the first section and the user presses the down arrow key
- **THEN** the caret is in the second section, and the second section is active

#### Scenario: Chord in another section
- **WHEN** the first section is active and the user clicks a chord label in the second section
- **THEN** the second section is active and no chord is opened for editing

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
