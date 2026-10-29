# Spec Delta

## MODIFIED Requirements

### Requirement: Adding and editing chords
The user SHALL be able to add a chord at the caret, and to edit and remove a chord, by keyboard. Clicking or tapping a chord's label SHALL open it for editing. Only text that is a chord is accepted, and the chord shows in its canonical form. Text that isn't a chord SHALL keep the input open with a note, and Cancel SHALL still close it. The chord input SHALL have the buttons "Done" and "Cancel", and "Remove" when it edits a chord.

#### Scenario: Add by keyboard
- **WHEN** the caret is just before the "r" in "wretch" and the user presses Ctrl+K or Cmd+K and enters "Am"
- **THEN** "Am" appears above the "r"

#### Scenario: Shown in canonical form
- **WHEN** the user enters "Bb-7" and presses "Done"
- **THEN** "Bbm7" appears above the letter, and opening it again shows "Bbm7" in the input

#### Scenario: Not a chord
- **WHEN** the user enters "N.C." and presses "Done"
- **THEN** the input stays open with a note, and no chord is added

#### Scenario: Delete a chord
- **WHEN** the user opens a chord and presses "Remove"
- **THEN** the chord is gone and the lyrics are unchanged

#### Scenario: Buttons for a new chord
- **WHEN** the user opens the chord input to add a chord
- **THEN** it shows "Done" and "Cancel", and no "Remove"
