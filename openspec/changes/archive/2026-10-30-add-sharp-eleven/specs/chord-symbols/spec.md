## ADDED Requirements

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
