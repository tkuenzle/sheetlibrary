# Spec Delta

## ADDED Requirements

### Requirement: Section labels
Each section SHALL show its label above its lyrics, inside the section, at every window width. A section without a label SHALL keep the same empty row, so its lyrics don't move when it becomes active. The label SHALL NOT take the caret and SHALL NOT change where chords sit over their letters. Screen readers SHALL read the label, such as "Chorus", before the lyrics.

#### Scenario: Label above the lyrics
- **WHEN** a section labeled "Chorus" is shown, in a wide window or on a phone
- **THEN** "Chorus" sits above the section's first line, inside the section

#### Scenario: Becoming active
- **WHEN** the user clicks into a section without a label
- **THEN** its lyrics stay where they were

#### Scenario: Caret at a section's start
- **WHEN** the user presses the left arrow key at the start of a section's first line
- **THEN** the caret goes to the end of the section before, not onto the label

#### Scenario: Screen reader
- **WHEN** a screen reader reads a section labeled "Chorus"
- **THEN** it starts with "Chorus"

### Requirement: Adding a label
The active section SHALL show "Add label" where its label goes when it has no label. Other sections without a label SHALL show nothing there.

#### Scenario: Section without a label
- **WHEN** the user clicks into a section without a label
- **THEN** "Add label" shows above its lyrics, and the other sections without a label show nothing there

### Requirement: Editing a label in place
A click or tap on the active section's label, or on "Add label", SHALL turn it into a text field in the same place. Enter or a click elsewhere SHALL keep the text, and Escape SHALL cancel. Either way the section SHALL stay active. Keeping an empty field SHALL remove the label. Any text SHALL be accepted. Keeping SHALL be one undo step. A click on another section's label SHALL only make that section active.

#### Scenario: Rename
- **WHEN** the user clicks the label "Verse 2", types "Chorus" in its place and presses Enter
- **THEN** the section is labeled "Chorus", and one undo brings back "Verse 2"

#### Scenario: Escape
- **WHEN** the user changes the text in the label field and presses Escape
- **THEN** the label is unchanged and the section is still active

#### Scenario: Remove
- **WHEN** the user clears the label field and presses Enter
- **THEN** the section has no label and shows "Add label"

#### Scenario: Label of another section
- **WHEN** the first section is active and the user clicks the second section's label
- **THEN** the second section is active and no label field opens

### Requirement: Kept labels are cleaned up
A kept label SHALL be cleaned up as the chord sheet model does: spaces at both ends go, and a run of spaces becomes one space. The label field SHALL take at most 40 characters.

#### Scenario: Spaces around a label
- **WHEN** the user types "  Chorus  " in the label field and presses Enter
- **THEN** the section is labeled "Chorus"

### Requirement: Label shortcut
Ctrl+Shift+L, or ⌘⇧L on a Mac, SHALL open the label field of the active section. When the label field closes, however it was opened, the caret SHALL be back where it was in the lyrics.

#### Scenario: Label by keyboard
- **WHEN** the caret is after "Was" in a section without a label, and the user presses Ctrl+Shift+L, types "Chorus" and presses Enter
- **THEN** the section is labeled "Chorus" and the caret is after "Was"

### Requirement: Label suggestions
While the label field is open, suggestions SHALL show below it: Intro, Verse, Pre-chorus, Chorus, Bridge, Solo and Outro. Typing SHALL narrow them to the ones that contain the typed text, ignoring case. Picking a suggestion, by click, tap, or arrow keys and Enter, SHALL set it as the label and close the field.

#### Scenario: Narrowing
- **WHEN** the user types "ch" in the label field
- **THEN** only "Pre-chorus" and "Chorus" are suggested

#### Scenario: Tap a suggestion
- **WHEN** the label field is open on a section without a label and the user taps "Chorus"
- **THEN** the section is labeled "Chorus" and the field is closed

## MODIFIED Requirements

### Requirement: Editing a sheet
The editor SHALL edit all sections of a chord sheet in one place. It SHALL show the sections, their labels, lines and chords as stored, and hand back the same sheet when nothing was changed.

#### Scenario: Unchanged sheet
- **WHEN** a sheet with two sections, one labeled "Chorus" and one ending with a chord after its last letter, is loaded and handed back without changes
- **THEN** the sheet has the same sections, labels, text and chords as before

### Requirement: Blank line is a section break
Enter on an empty line SHALL split the section there: the empty line goes, and the lines after it start a new section with the caret. Pasted text with blank lines SHALL become one section per block of lines. New sections SHALL have no label; the section that was split keeps its own.

#### Scenario: Enter on an empty line
- **WHEN** the caret is at the end of the second of four lines and the user presses Enter twice
- **THEN** the section holds the first two lines, a new section holds the other two, and the caret is at the start of the new section

#### Scenario: Paste with blank lines
- **WHEN** the user pastes "a\nb\n\nc" into an empty sheet
- **THEN** the sheet has two sections: "a" and "b", then "c"

#### Scenario: Splitting a labeled section
- **WHEN** the user splits a section labeled "Verse 1" with Enter on an empty line
- **THEN** the first section is still labeled "Verse 1" and the new section has no label

### Requirement: Joining sections
Backspace at the start of a section SHALL join it with the section before: its lines are added after that section's lines, and no lines are merged. The joined section SHALL keep the label of the section before, even when that section has none; the other label is dropped.

#### Scenario: Backspace at the start
- **WHEN** the caret is at the start of the second section and the user presses Backspace
- **THEN** the lines of both sections form one section, and the caret stays where it was

#### Scenario: Labels when joining
- **WHEN** a section labeled "Chorus" is joined with the section before it, labeled "Verse 1", and the user then presses undo
- **THEN** the joined section is labeled "Verse 1", and after undo both sections are back with their labels

#### Scenario: Section before without a label
- **WHEN** a section labeled "Chorus" is joined with the section before it, which has no label
- **THEN** the joined section has no label

## REMOVED Requirements

### Requirement: Section numbers
**Reason**: Labels name the sections, and a number beside a label read as clutter. Keeping numbers only for sections without a label would look inconsistent.
**Migration**: Sections show their label above the lyrics; the active section without a label shows "Add label". The toolbar still tells screen readers "Section 2 of 3".
