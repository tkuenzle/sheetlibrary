## REMOVED Requirements

### Requirement: Placing chords
**Reason**: Placing by tap and moving chords wait for chord interactions (M2d), which brings dragging. Until then, chords are added by keyboard.
**Migration**: Replaced by "Adding and editing chords".

## ADDED Requirements

### Requirement: Adding and editing chords
The user SHALL be able to add a chord at the caret, and to edit and delete a chord, by keyboard. Clicking or tapping a chord's label SHALL open it for editing. Any chord text is accepted.

#### Scenario: Add by keyboard
- **WHEN** the caret is just before the "r" in "wretch" and the user presses Ctrl+K or Cmd+K and enters "Am"
- **THEN** "Am" appears above the "r"

#### Scenario: Delete a chord
- **WHEN** the user deletes a chord with the chord controls
- **THEN** the chord is gone and the lyrics are unchanged

### Requirement: Editing one section
The editor SHALL edit one section of a chord sheet. It SHALL show the section's lines and chords as stored, and hand back the same lines and chords when nothing was changed.

#### Scenario: Unchanged section
- **WHEN** a section whose last line ends with a chord after its last letter is loaded and handed back without changes
- **THEN** the section has the same text and chords as before

### Requirement: Handing back a section
When the user finishes the section, the editor SHALL hand it back cleaned up and checked by the chord sheet model. While the user types, the section may break the model's rules, for example with an empty line.

#### Scenario: Empty line dropped
- **WHEN** the user adds an empty line between two lines and finishes the section
- **THEN** the handed-back section holds only the two lines

#### Scenario: Nothing left
- **WHEN** the user selects everything in the section, deletes it and finishes the section
- **THEN** no section is handed back
