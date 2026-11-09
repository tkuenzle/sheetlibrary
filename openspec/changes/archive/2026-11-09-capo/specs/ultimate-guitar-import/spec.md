# Spec Delta

## ADDED Requirements

### Requirement: Capo in the text
A line that gives a capo, such as `Capo: 2nd fret`, `Capo 2` or `Capo: 2`, SHALL give the capo the text is written for, here 2. Text without such a line, or with a fret that isn't from 1 to 9, SHALL give no capo. Reading the capo SHALL NOT move any chord.

#### Scenario: Capo line
- **WHEN** text with the line `Capo: 2nd fret` and the chords G, C and D is read
- **THEN** it gives capo 2, and the chords are still G, C and D

#### Scenario: Short capo line
- **WHEN** text with the line `Capo 3` is read
- **THEN** it gives capo 3

#### Scenario: No capo line
- **WHEN** text without a capo line is read
- **THEN** it gives no capo
