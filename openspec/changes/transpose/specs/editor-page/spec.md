# Spec Delta

## ADDED Requirements

### Requirement: Key beside the title
The page SHALL show the sheet's guessed key on a button beside the heading, at every width. The button SHALL follow the sheet: after an edit or a transpose, it shows the key guessed from the chords then. A sheet without chords SHALL have no key button.

#### Scenario: Seed song's key
- **WHEN** a visitor opens `/editor`
- **THEN** a button reading "Key G" sits beside the heading "Amazing Grace"

#### Scenario: No chords
- **WHEN** a visitor removes every chord of the seed song
- **THEN** the key button is gone, and it comes back with the first new chord

### Requirement: Transposing from the key button
The key button SHALL open a panel with the keys to move to and a step down and a step up by one semitone. The current key SHALL be marked, and the panel SHALL say the key was guessed from the chords. On a phone, the panel SHALL be a bottom sheet. Picking a key or a step SHALL move the sheet's chords right away and keep the panel open. Escape, a click outside or the key button SHALL close it.

#### Scenario: Picking a key
- **WHEN** a visitor opens the key button and picks A
- **THEN** the seed song's G, C and D read A, D and E, the button reads "Key A", and the panel is still open

#### Scenario: Stepping
- **WHEN** a visitor opens the key button and steps up twice
- **THEN** the button reads "Key A"

### Requirement: Undoing a transpose
A transpose SHALL be one step to undo, like any other edit. Ctrl Z and ⌘ Z SHALL undo while the panel is open too.

#### Scenario: Undo
- **WHEN** a visitor moves the seed song to A and then presses Ctrl Z in the panel
- **THEN** the chords and the button are back in G

### Requirement: Back to the first key
Once the key has changed, the panel SHALL show a button back to the key it opened in, such as "Back to G". It SHALL put the chords back as they were when the panel opened, as one step to undo.

#### Scenario: Back to G
- **WHEN** a visitor opens the key button in G, steps up three times and picks "Back to G"
- **THEN** the chords are as before and the button reads "Key G"
