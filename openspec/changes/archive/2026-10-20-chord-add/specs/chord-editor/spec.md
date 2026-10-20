## ADDED Requirements

### Requirement: Adding chords by mouse
When the mouse is in the band below the lyrics of the active section, a caret SHALL show in front of the letter at the pointer, in the lyrics, with a "+" under it. Spaces and the end of a line count as spots. A click there SHALL open the chord input for that letter, and the chord entered SHALL go after any chords already on it. Adding SHALL be one undo step, SHALL NOT move the text caret, and SHALL NOT end editing.

#### Scenario: Add on a letter
- **WHEN** the user clicks below the "r" in "wretch" and enters "Am"
- **THEN** "Am" sits on the "r", the text caret is where it was, and one undo removes "Am"

#### Scenario: Add to a pile
- **WHEN** "G" sits on the "t" of "the" and the user clicks below the "t" and enters "C"
- **THEN** the "t" holds "G C", in that order

#### Scenario: Add at the end of a line
- **WHEN** the user clicks below the line, past its last letter, and enters "D"
- **THEN** "D" sits after the last letter

### Requirement: Where the "+" shows
The "+" SHALL only show below the lyrics of the active section. Over the lyrics, a click SHALL place the text caret as before.

#### Scenario: Another section
- **WHEN** the first section is active and the mouse is below the lyrics of the second section
- **THEN** no "+" shows

#### Scenario: Click on the lyrics
- **WHEN** the user clicks on a letter of the active section
- **THEN** the text caret moves there and the chord input does not open
