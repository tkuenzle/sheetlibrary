## ADDED Requirements

### Requirement: Chords in round brackets
A chord in round brackets, such as `(C)`, SHALL be held when the chord before it is the same chord, and optional otherwise. The chord before it is the one just before it in the text, in any earlier line or section. The same chord means the same root, suffix and bass. A chord with nothing before it SHALL be optional.

#### Scenario: Held into the chorus
- **WHEN** `[Verse]`, `G  C` above a lyrics line, then `[Chorus]` and `(C)  D` above a lyrics line are read
- **THEN** the chorus starts with a held C, then D

#### Scenario: Optional chord
- **WHEN** `G  (C)  D` is read above a lyrics line
- **THEN** the line has G, an optional C and D

## MODIFIED Requirements

### Requirement: Chord lines
A line SHALL be a chord line when each word on it is a chord, a chord in round brackets, a bar `|`, a repeat count such as `x2` or `(x2)`, or `N.C.`, and at least one word is a chord or a chord in round brackets. Its chords SHALL be kept, in their canonical form. Its other words SHALL be dropped, except as the next requirement says.

#### Scenario: Bars
- **WHEN** the line `|G   |D   |Em  |C   |` is read
- **THEN** it gives the chords G, D, Em and C

#### Scenario: Lyrics that look like chords
- **WHEN** the line `Am I wrong` is read
- **THEN** it is a lyrics line, since "I" and "wrong" are not chords

#### Scenario: Only a chord in brackets
- **WHEN** the line `(Am)` is read
- **THEN** it is a chord line with one chord, Am
