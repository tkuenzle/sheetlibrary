# chord-sheet-model Specification

## Purpose

Defines how the content of a chord sheet is stored: sections of lines with chords, and the rules every sheet follows.

## Requirements

### Requirement: Sheet content
A chord sheet's content SHALL be JSON with a format name (`chordsheet`), a version number and a list of sections. A section SHALL hold one or more lines. A line SHALL hold its text and its chords. Each chord SHALL hold its position in the text and its chord text.

#### Scenario: One line
- **WHEN** the line "That saved a wretch like [D]me" is stored
- **THEN** its text is "That saved a wretch like me" and it has one chord, "D" at position 25

### Requirement: Versions
Content SHALL carry the version of the model it was written with. Content with a version the model doesn't know SHALL be rejected.

#### Scenario: Unknown version
- **WHEN** content with version 99 is checked
- **THEN** it is rejected as an unknown version

### Requirement: Chords are text
Chord text SHALL be stored exactly as the user typed it and SHALL NOT be parsed.

#### Scenario: Spelling and annotations are kept
- **WHEN** a sheet holds the chords "A#", "Bb" and "*N.C."
- **THEN** they are stored and read back unchanged

### Requirement: Chord positions
A chord's position SHALL be an index into its line's text, counted in UTF-16 code units, from 0 up to and including the text's length. The length means "after the last letter". A position SHALL NOT fall inside a surrogate pair.

#### Scenario: Chord after the last letter
- **WHEN** a line with the text "me" has a chord after its last letter
- **THEN** that chord's position is 2

### Requirement: Chord order
A line's chords SHALL be sorted by position. Several chords at the same position SHALL keep their order.

#### Scenario: Pile
- **WHEN** "G7" and then "C" are placed on the same letter
- **THEN** both are stored at that position, "G7" before "C"

### Requirement: No empty lines
A line SHALL have at least one chord or one character that isn't a space. Lines with only chords are allowed.

#### Scenario: Chord-only line
- **WHEN** a line has the text "  " and the chords "G", "C" and "D"
- **THEN** the line is valid

#### Scenario: Empty line
- **WHEN** a line has no chords and its text is empty or only spaces
- **THEN** the line is invalid

### Requirement: Checking a sheet
The model SHALL check content against its rules and report each problem it finds. Besides the rules above, line text and chord text SHALL NOT contain line breaks, and chord text SHALL NOT be empty.

#### Scenario: Valid sheet
- **WHEN** a sheet that follows every rule is checked
- **THEN** no problems are reported

#### Scenario: Several problems
- **WHEN** a sheet has an empty line and a chord with empty text
- **THEN** both problems are reported, each with where it is

### Requirement: Cleaning up a section
The model SHALL clean up a section by dropping its empty lines. A section left with no lines SHALL be removed.

#### Scenario: Empty lines dropped
- **WHEN** a section with two lyric lines and an empty line between them is cleaned up
- **THEN** it holds the two lyric lines

#### Scenario: Nothing left
- **WHEN** a section with only empty lines is cleaned up
- **THEN** the section is removed
