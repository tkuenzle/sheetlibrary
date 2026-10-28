# Spec Delta

## ADDED Requirements

### Requirement: Cleaning up a label
Cleaning up a section SHALL also clean up its label: spaces at both ends are dropped, a run of spaces inside becomes one space, and a label left empty is removed.

#### Scenario: Label cleaned up
- **WHEN** a section labeled "  Verse   1 " is cleaned up
- **THEN** its label is "Verse 1"

#### Scenario: Label of only spaces
- **WHEN** a section labeled "   " is cleaned up
- **THEN** the section has no label

## MODIFIED Requirements

### Requirement: Sheet content
A chord sheet's content SHALL be JSON with a format name (`chordsheet`), a version number and a list of sections. A section SHALL hold one or more lines, and MAY have a label, which SHALL be text. A line SHALL hold its text and its chords. Each chord SHALL hold its position in the text and its chord text.

#### Scenario: One line
- **WHEN** the line "That saved a wretch like [D]me" is stored
- **THEN** its text is "That saved a wretch like me" and it has one chord, "D" at position 25

#### Scenario: Labeled section
- **WHEN** a section labeled "Chorus" is stored
- **THEN** it holds the label "Chorus" and its lines, and the content's version is still 1

#### Scenario: Label that isn't text
- **WHEN** content with a section whose label is a number is checked
- **THEN** a problem is reported for that section

### Requirement: Checking a sheet
The model SHALL check content against its rules and report each problem it finds. Besides the rules above, line text and chord text SHALL NOT contain line breaks, and chord text SHALL NOT be empty. A section's label SHALL NOT contain line breaks, SHALL NOT be empty or only spaces, and SHALL be at most 40 characters long.

#### Scenario: Valid sheet
- **WHEN** a sheet that follows every rule is checked
- **THEN** no problems are reported

#### Scenario: Several problems
- **WHEN** a sheet has an empty line and a chord with empty text
- **THEN** both problems are reported, each with where it is

#### Scenario: Label problems
- **WHEN** a sheet has a section labeled with only spaces and a section with a label of 41 characters
- **THEN** both problems are reported, each with its section
