## ADDED Requirements

### Requirement: Moving chords by dragging
The user SHALL be able to drag a chord's label onto another letter to move the chord there. While dragging, a caret SHALL show where the chord will land. The chord SHALL go after any chords already on that letter. A tap or click without moving SHALL still open the chord for editing. A move SHALL be one undo step and SHALL NOT move the text caret. Escape SHALL cancel a drag. Starting a drag SHALL close the chord input without saving it. Only one chord SHALL be dragged at a time.

#### Scenario: Drag onto a letter
- **WHEN** the user drags "Cmaj7" onto the "t" of "to"
- **THEN** "Cmaj7" sits on the "t", and one undo puts it back

#### Scenario: Escape
- **WHEN** the user is dragging a chord and presses Escape
- **THEN** the chord stays where it was

#### Scenario: Chord input open
- **WHEN** the chord input is open with unsaved text and the user drags a chord onto a letter
- **THEN** the chord input is closed, its text is not saved, and the chord sits on the letter

### Requirement: Dragging stays in the active section
Only the active section's chords SHALL be draggable, and a dragged chord SHALL only land in the active section. Over any other place the caret SHALL hide, and letting go SHALL leave the chord where it was.

#### Scenario: Drop on another section
- **WHEN** the user drags a chord from the active section onto a letter in another section and lets go
- **THEN** the chord stays where it was, and the other section does not become active

### Requirement: Dropping into a pile
When a chord is dragged over the labels of a pile, the caret SHALL show between the labels, and the chord SHALL land at that spot in the pile. This SHALL work for a chord from the same pile, which reorders the pile.

#### Scenario: Reorder a pile
- **WHEN** "G C Em" sit on one letter and the user drags "Em" between "G" and "C"
- **THEN** the letter holds "G Em C", in that order

#### Scenario: Drop into a pile
- **WHEN** "G C" sit on one letter and the user drags "D" from another letter between them
- **THEN** the letter holds "G D C"

### Requirement: Scrolling while dragging
While a chord is dragged near the top or bottom edge of the window, the page SHALL scroll in that direction, and the caret SHALL follow the chord.

#### Scenario: Drag to a line out of view
- **WHEN** the active section is taller than the window and the user drags a chord to the bottom edge
- **THEN** the page scrolls until the user stops at a line, and the chord lands there
