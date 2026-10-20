## MODIFIED Requirements

### Requirement: Cleaning up a section
The model SHALL clean up a section by dropping spaces from each line and then dropping its empty lines. Spaces at both ends of a line SHALL be dropped. A run of spaces inside a line SHALL become one space, or, if some of them hold chords, only those. A space that holds a chord SHALL always be kept. Chord positions SHALL move with the text. A section left with no lines SHALL be removed.

#### Scenario: Empty lines dropped
- **WHEN** a section with two lyric lines and an empty line between them is cleaned up
- **THEN** it holds the two lyric lines

#### Scenario: Spaces trimmed
- **WHEN** a line "  Amazing grace " with "D" at position 2 is cleaned up
- **THEN** the line is "Amazing grace" with "D" at position 0

#### Scenario: Double spaces collapsed
- **WHEN** a line "Amazing   grace" is cleaned up
- **THEN** the line is "Amazing grace"

#### Scenario: Run of spaces with a chord
- **WHEN** a line "Amazing  grace" with "G" at position 8 is cleaned up
- **THEN** the line is "Amazing grace" with "G" at position 7

#### Scenario: Space with a chord kept
- **WHEN** a line " Amazing" with "G" at position 0 is cleaned up
- **THEN** the line is unchanged

#### Scenario: Nothing left
- **WHEN** a section with only empty lines is cleaned up
- **THEN** the section is removed
