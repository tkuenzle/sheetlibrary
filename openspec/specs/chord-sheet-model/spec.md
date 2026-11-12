# chord-sheet-model Specification

## Purpose

Defines how the content of a chord sheet is stored: sections of lines with chords, and the rules every sheet follows.

## Requirements

### Requirement: Sheet content
A chord sheet's content SHALL be JSON with a format name (`chordsheet`), a version number and a list of sections. A section SHALL hold one or more lines, and MAY have a label, which SHALL be text. A line SHALL hold its text and its chords. Each chord SHALL hold its position in the text and its root, and its suffix, bass and mark if it has them.

#### Scenario: One line
- **WHEN** the line "That saved a wretch like [D]me" is stored
- **THEN** its text is "That saved a wretch like me" and it has one chord, with the root "D" at position 25 and no suffix or bass

#### Scenario: Labeled section
- **WHEN** a section labeled "Chorus" is stored
- **THEN** it holds the label "Chorus" and its lines, and the content's version is still 1

#### Scenario: Label that isn't text
- **WHEN** content with a section whose label is a number is checked
- **THEN** a problem is reported for that section

### Requirement: Versions
Content SHALL carry the version of the model it was written with. Content with a version the model doesn't know SHALL be rejected.

#### Scenario: Unknown version
- **WHEN** content with version 99 is checked
- **THEN** it is rejected as an unknown version

### Requirement: Chords are stored as parts
A chord SHALL be stored as a root, an optional suffix and an optional bass, in the canonical form of the chord symbols. The text the user typed SHALL NOT be stored. The spelling of the root and the bass SHALL be kept.

#### Scenario: Stored as parts
- **WHEN** the chord "Bb-7/F" is entered
- **THEN** it is stored with the root "Bb", the suffix "m7" and the bass "F"

#### Scenario: Spelling is kept
- **WHEN** a sheet holds the chords "A#" and "Bb"
- **THEN** they are stored and read back with their own spelling

### Requirement: Chord marks
A chord MAY have one mark: `held`, for a chord that is still sounding, or `optional`, for a chord that may be left out. A chord without a mark SHALL be stored without one. Checking a sheet SHALL report a chord with any other mark.

#### Scenario: Held chord
- **WHEN** a held C is stored
- **THEN** it holds the root "C" and the mark "held", and the content's version is still 1

#### Scenario: Unknown mark
- **WHEN** a sheet with a chord marked "maybe" is checked
- **THEN** a problem is reported for that chord

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
The model SHALL check content against its rules and report each problem it finds. Besides the rules above, line text SHALL NOT contain line breaks, and a chord's root, suffix and bass SHALL be in canonical form. A chord's bass SHALL NOT be the same as its root. A section's label SHALL NOT contain line breaks, SHALL NOT be empty or only spaces, and SHALL be at most 40 characters long.

#### Scenario: Valid sheet
- **WHEN** a sheet that follows every rule is checked
- **THEN** no problems are reported

#### Scenario: Several problems
- **WHEN** a sheet has an empty line and a chord with the root "H"
- **THEN** both problems are reported, each with where it is

#### Scenario: Suffix not canonical
- **WHEN** a sheet has a chord with the suffix "min7", and a chord with the root "C" and the bass "C"
- **THEN** a problem is reported for each of them

#### Scenario: Label problems
- **WHEN** a sheet has a section labeled with only spaces and a section with a label of 41 characters
- **THEN** both problems are reported, each with its section

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

### Requirement: Cleaning up a label
Cleaning up a section SHALL also clean up its label: spaces at both ends are dropped, a run of spaces inside becomes one space, and a label left empty is removed.

#### Scenario: Label cleaned up
- **WHEN** a section labeled "  Verse   1 " is cleaned up
- **THEN** its label is "Verse 1"

#### Scenario: Label of only spaces
- **WHEN** a section labeled "   " is cleaned up
- **THEN** the section has no label

### Requirement: The sheet's key
Content MAY hold the sheet's key: a tonic, spelled as a chord's root is, and whether it is minor. Content without a key SHALL be stored without one, and its version SHALL still be 1. Checking a sheet SHALL report a key whose tonic isn't a note, or that doesn't say whether it is minor.

#### Scenario: Key stored
- **WHEN** a sheet in E minor is stored with its key
- **THEN** its content holds the tonic "E" and minor, and the content's version is still 1

#### Scenario: Key that isn't valid
- **WHEN** content with a key whose tonic is "H" is checked
- **THEN** a problem is reported for the key

### Requirement: Lyrics as plain text
The model SHALL give a sheet's lyrics as plain text: the text of each line, in order, one line each. It SHALL leave out chords and section labels. A line with only chords SHALL be left out.

#### Scenario: Two sections
- **WHEN** a sheet has a section labeled "Verse" with the lines "Amazing grace" and "How sweet the sound", each with chords, and a section with the line "Was blind"
- **THEN** its lyrics are "Amazing grace", "How sweet the sound" and "Was blind", on three lines, without the chords or "Verse"

#### Scenario: A line with only chords
- **WHEN** a sheet has a line with the chords G and C and no text, followed by the line "Amazing grace"
- **THEN** its lyrics are only "Amazing grace"
