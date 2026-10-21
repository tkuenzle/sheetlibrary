## ADDED Requirements

### Requirement: Section toolbar
The active section SHALL have a toolbar with "+ Chord", "move up" and "move down" buttons, each at least 44px tall. Other sections SHALL NOT have one. On a device whose main pointer is a mouse, the toolbar SHALL sit at the right edge of the space above the active section. Pressing a toolbar button SHALL NOT take focus from the editor.

#### Scenario: Mouse
- **WHEN** the user clicks into the second section on a desktop and points at the first
- **THEN** the toolbar shows above the second section only

### Requirement: Docked toolbar on touch devices
On a device whose main pointer is a finger, the section toolbar SHALL be docked at the bottom of the visible area, above the keyboard when it is open. It SHALL NOT cover the caret.

#### Scenario: Touch
- **WHEN** the user taps a letter on a phone
- **THEN** the toolbar shows at the bottom of the visible area, and the caret's line is above it

### Requirement: Adding a chord from the toolbar
Pressing "+ Chord" SHALL open the chord input for the letter after the caret, and the chord entered SHALL go after any chords already on it. With a selection, the caret's end of it counts. Adding SHALL be one undo step and SHALL NOT move the text caret.

#### Scenario: Add on a letter
- **WHEN** the caret is just before the "r" in "wretch", the user presses "+ Chord" and enters "Am"
- **THEN** "Am" sits on the "r", the text caret is where it was, and one undo removes "Am"

#### Scenario: Add to a pile
- **WHEN** "G" sits on the "t" of "the", the caret is just before the "t", and the user presses "+ Chord" and enters "C"
- **THEN** the "t" holds "G C", in that order

### Requirement: Moving a section
Pressing "move up" or "move down" SHALL swap the active section with the one before or after it. The moved section SHALL stay active, with the caret at the same spot in its text, and SHALL NOT be cleaned up. A move SHALL be one undo step, and undo SHALL make the moved section active. In the first section, "move up" SHALL be disabled; in the last, "move down" SHALL be disabled. A sheet with a single section SHALL NOT show them.

#### Scenario: Move up
- **WHEN** the caret is after "Was" in the second of three sections and the user presses "move up"
- **THEN** that section is first, it is still active, and the caret is still after "Was"

#### Scenario: Undo
- **WHEN** the user moves a section up and then presses undo
- **THEN** the section is back in its place and active

#### Scenario: First section
- **WHEN** the first section is active
- **THEN** "move up" is disabled and "move down" can be pressed

### Requirement: Pressing move again
With a mouse, after a move, the page SHALL scroll so the move buttons stay where they were in the window. With the docked toolbar, the page SHALL keep the caret in view. Either way, the user SHALL be able to press again without looking for the button.

#### Scenario: Press again
- **WHEN** the active section is third of three and the user presses "move up" twice without moving the pointer or finger
- **THEN** the section is first

## REMOVED Requirements

### Requirement: Adding chords by touch
**Reason**: The floating "+ Chord" button above the caret collided with the section's move buttons. Adding chords by touch now goes through the section toolbar.
**Migration**: Replaced by "Section toolbar", "Docked toolbar on touch devices" and "Adding a chord from the toolbar".

### Requirement: When the "+ Chord" button shows
**Reason**: The toolbar's "+ Chord" shows whenever its section is active, so the rules for when the floating button shows are no longer needed.
**Migration**: Replaced by "Section toolbar".
