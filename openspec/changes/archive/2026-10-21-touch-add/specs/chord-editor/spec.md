## ADDED Requirements

### Requirement: Adding chords by touch
When a tap moves the caret in the active section, a "+ Chord" button SHALL show above the caret, at least 44px tall. When the window leaves no room above, it SHALL show below the caret. Tapping it SHALL open the chord input for the letter after the caret, and the chord entered SHALL go after any chords already on it. Adding SHALL be one undo step and SHALL NOT move the text caret.

#### Scenario: Add on a letter
- **WHEN** the user taps just before the "r" in "wretch", taps "+ Chord" and enters "Am"
- **THEN** "Am" sits on the "r", the text caret is where it was, and one undo removes "Am"

#### Scenario: Add to a pile
- **WHEN** "G" sits on the "t" of "the", the user taps just before the "t", taps "+ Chord" and enters "C"
- **THEN** the "t" holds "G C", in that order

#### Scenario: Caret at the top of the window
- **WHEN** the user taps a line at the top of the window
- **THEN** the button shows below the caret and can be tapped

### Requirement: When the "+ Chord" button shows
The "+ Chord" button SHALL only show for a caret placed by touch in the active section, not for a selection or a caret placed by mouse. It SHALL show only once the caret has stopped moving and no finger is down. Typing, opening the chord input, or the caret leaving the section SHALL hide it. The next tap that moves the caret SHALL show it again.

#### Scenario: Typing hides it
- **WHEN** the button shows and the user types a letter
- **THEN** the button hides, and tapping another letter shows it at the new caret

#### Scenario: Dragging the caret
- **WHEN** the user drags the caret across a word with a finger
- **THEN** no button shows until the finger is lifted, and then it shows at the last caret only

#### Scenario: Selection
- **WHEN** the user selects a word by touch
- **THEN** no button shows

#### Scenario: Mouse
- **WHEN** the user clicks on a letter with the mouse
- **THEN** no button shows
