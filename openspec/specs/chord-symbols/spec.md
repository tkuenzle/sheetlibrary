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

### Requirement: Sharp eleven as an added note
`add#11` SHALL be an added note, written after `add9` and `add11`. A `#11` on a chord with no sixth or seventh SHALL be read as `add#11`. On a chord with a sixth or a seventh, `add#11` SHALL be read as the `#11` alteration.

#### Scenario: On a triad
- **WHEN** "Fadd#11", "F(#11)" and "Fm#11" are read
- **THEN** their suffixes are "add#11", "add#11" and "madd#11"

#### Scenario: With a sixth or a seventh
- **WHEN** "C7add#11" and "C6add#11" are read
- **THEN** their suffixes are "7#11" and "6#11"

### Requirement: Added notes on a triad
Added notes SHALL keep the 9 and 11 names on a triad. `add4` SHALL be read as `add11`, and `add#4` as `add#11`.

#### Scenario: Fourths
- **WHEN** "Cadd4" and "Cadd#4" are read
- **THEN** their suffixes are "add11" and "add#11"

### Requirement: Added thirteenth
`add13` SHALL be read as a 6 on a chord with no sixth or seventh, and as the 13 extension on a chord with a seventh, in place of a 9 or 11 extension. `add13` on a chord with a 6 or a 13 SHALL NOT be a chord.

#### Scenario: As a sixth or an extension
- **WHEN** "Cadd13", "Cmadd13", "C7add13", "C9add13" and "C11add13" are read
- **THEN** their suffixes are "6", "m6", "13", "13" and "13"

#### Scenario: With a sixth or a 13
- **WHEN** "C6add13" and "C13add13" are read
- **THEN** neither is a chord

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
