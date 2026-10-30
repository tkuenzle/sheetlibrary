## ADDED Requirements

### Requirement: Chord marks
A chord MAY have one mark: `held`, for a chord that is still sounding, or `optional`, for a chord that may be left out. A chord without a mark SHALL be stored without one. Checking a sheet SHALL report a chord with any other mark.

#### Scenario: Held chord
- **WHEN** a held C is stored
- **THEN** it holds the root "C" and the mark "held", and the content's version is still 1

#### Scenario: Unknown mark
- **WHEN** a sheet with a chord marked "maybe" is checked
- **THEN** a problem is reported for that chord

## MODIFIED Requirements

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
