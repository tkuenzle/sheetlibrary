# chord-symbols Specification

## Purpose

Reads the chord text a user types into a root, a suffix and a bass, and writes a chord back in its one canonical form.

## Requirements

### Requirement: Reading a chord
Typed chord text SHALL be read into a root, an optional suffix and an optional bass. The root and the bass SHALL be spelled note names: a letter from A to G and an optional sharp or flat, kept as spelled. Reading SHALL ignore spaces at both ends, accept a lowercase letter, and accept `♯` and `♭` for `#` and `b`.

#### Scenario: Root, suffix and bass
- **WHEN** "Bb-7/F" is read
- **THEN** the root is "Bb", the suffix is "m7" and the bass is "F"

#### Scenario: Spelling is kept
- **WHEN** "a#" and "B♭" are read
- **THEN** their roots are "A#" and "Bb"

### Requirement: Canonical suffix
A suffix SHALL be read as parts in this order: quality, sixth or seventh, extension, sus, alterations and added notes. Each part's common spellings SHALL be read as the same part. A chord SHALL have one canonical suffix, which writes its parts in that order with one spelling each and no brackets.

#### Scenario: Aliases
- **WHEN** "CΔ7", "CM7" and "Cmaj7" are read
- **THEN** each has the suffix "maj7"

#### Scenario: Parts in order
- **WHEN** "G7sus" and "Dmin7(b5)" are read
- **THEN** their suffixes are "7sus4" and "m7b5"

#### Scenario: One form per chord
- **WHEN** "C6/9", "C2", "Caug7" and "C7add9" are read
- **THEN** their suffixes are "6add9", "add9", "7#5" and "9"

#### Scenario: Bass on the root
- **WHEN** "C/C" is read
- **THEN** the root is "C" and there is no bass

### Requirement: Text that isn't a chord
Text that doesn't fit the grammar SHALL NOT be read as a chord. Only English note names SHALL be read.

#### Scenario: Not a chord
- **WHEN** "N.C.", "Cmj7" and "H7" are read
- **THEN** none of them is a chord

### Requirement: Writing a chord
A chord SHALL be written as its root, its suffix, and a slash and its bass if it has one. Reading the written text SHALL give the same chord.

#### Scenario: Written back
- **WHEN** the chord with root "Bb", suffix "m7" and bass "F" is written
- **THEN** the text is "Bbm7/F"
