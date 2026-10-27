# Spec Delta

## MODIFIED Requirements

### Requirement: Adding and editing chords
The user SHALL be able to add a chord at the caret, and to edit and remove a chord, by keyboard. Clicking or tapping a chord's label SHALL open it for editing. Any chord text is accepted. The chord input SHALL have the buttons "Done" and "Cancel", and "Remove" when it edits a chord.

#### Scenario: Add by keyboard
- **WHEN** the caret is just before the "r" in "wretch" and the user presses Ctrl+K or Cmd+K and enters "Am"
- **THEN** "Am" appears above the "r"

#### Scenario: Delete a chord
- **WHEN** the user opens a chord and presses "Remove"
- **THEN** the chord is gone and the lyrics are unchanged

#### Scenario: Buttons for a new chord
- **WHEN** the user opens the chord input to add a chord
- **THEN** it shows "Done" and "Cancel", and no "Remove"

### Requirement: Section numbers
Each section SHALL show its number, counted from the top, in a round badge. The active section's badge SHALL stand out from the others. The badge SHALL sit left of the lyrics, also on a tablet with the toolbar docked. Only in a narrow window, as on a phone, SHALL it sit above them. Screen readers SHALL read it as the word the app sets, "Section", and the number, or only the number in a browser that can't put a counter in the alternative text. It SHALL NOT take the caret and SHALL NOT change where chords sit over their letters.

#### Scenario: After a move
- **WHEN** the second of three sections is moved up
- **THEN** it shows "1", and the section it swapped with shows "2"

#### Scenario: Tablet
- **WHEN** the user edits a section on a tablet
- **THEN** the toolbar is docked, and each badge sits left of its section's lyrics

#### Scenario: Phone
- **WHEN** the user edits a section on a phone
- **THEN** each badge sits above its section's lyrics

#### Scenario: Screen reader
- **WHEN** a screen reader reads the second section
- **THEN** it starts with "Section 2"

#### Scenario: Caret at a section's start
- **WHEN** the user presses the left arrow key at the start of a section's first line
- **THEN** the caret goes to the end of the section before, not onto the badge
