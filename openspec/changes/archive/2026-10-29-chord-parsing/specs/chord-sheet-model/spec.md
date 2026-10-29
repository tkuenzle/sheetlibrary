# Spec Delta

## ADDED Requirements

### Requirement: Chords are stored as parts
A chord SHALL be stored as a root, an optional suffix and an optional bass, in the canonical form of the chord symbols. The text the user typed SHALL NOT be stored. The spelling of the root and the bass SHALL be kept.

#### Scenario: Stored as parts
- **WHEN** the chord "Bb-7/F" is entered
- **THEN** it is stored with the root "Bb", the suffix "m7" and the bass "F"

#### Scenario: Spelling is kept
- **WHEN** a sheet holds the chords "A#" and "Bb"
- **THEN** they are stored and read back with their own spelling

## MODIFIED Requirements

### Requirement: Sheet content
A chord sheet's content SHALL be JSON with a format name (`chordsheet`), a version number and a list of sections. A section SHALL hold one or more lines, and MAY have a label, which SHALL be text. A line SHALL hold its text and its chords. Each chord SHALL hold its position in the text and its root, and its suffix and bass if it has them.

#### Scenario: One line
- **WHEN** the line "That saved a wretch like [D]me" is stored
- **THEN** its text is "That saved a wretch like me" and it has one chord, with the root "D" at position 25 and no suffix or bass

#### Scenario: Labeled section
- **WHEN** a section labeled "Chorus" is stored
- **THEN** it holds the label "Chorus" and its lines, and the content's version is still 1

#### Scenario: Label that isn't text
- **WHEN** content with a section whose label is a number is checked
- **THEN** a problem is reported for that section

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

## REMOVED Requirements

### Requirement: Chords are text
**Reason**: Transposing, the import and display styles need to know what a chord is. Chords are now stored as parts, see "Chords are stored as parts".
**Migration**: Only the seed song holds chords; it is rewritten in the new shape. Nothing else is stored yet.
