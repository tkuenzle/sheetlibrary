# Spec Delta

## MODIFIED Requirements

### Requirement: Editor with the seed song
The page at `/editor` SHALL show the chord editor with the seed song "Amazing Grace" loaded. Its sections SHALL be labeled "Verse 1" and "Verse 2".

#### Scenario: Opening the editor
- **WHEN** a visitor opens `/editor`
- **THEN** the page shows "Amazing Grace" with its chords, ready to edit, and its sections are labeled "Verse 1" and "Verse 2"

### Requirement: Help for the device
The help SHALL match the main pointer. With a finger, it SHALL show how to edit by touch, then the keys. With a mouse, it SHALL show the keys, then how to edit with a mouse. The keys SHALL name both Ctrl K and ⌘ K for adding or changing a chord, and both Ctrl Shift L and ⌘ ⇧ L for editing the section's label.

#### Scenario: Help on a phone
- **WHEN** a visitor opens the help on a phone
- **THEN** it shows "With touch" and the keys, and no "With a mouse"

#### Scenario: Help with a mouse
- **WHEN** a visitor reads the help with a mouse
- **THEN** it shows the keys, including "Ctrl K" and "⌘ K", "Ctrl Shift L" and "⌘ ⇧ L", and "With a mouse", and no "With touch"
