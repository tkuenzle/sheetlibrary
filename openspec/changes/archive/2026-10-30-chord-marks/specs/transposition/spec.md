## MODIFIED Requirements

### Requirement: Guessing the key
A sheet's key SHALL be guessed from its chords, as a tonic and major or minor. Held and optional chords SHALL count like any other. The guess SHALL keep the sheet's own spelling of the tonic.

#### Scenario: Major sheet
- **WHEN** the key of "Amazing Grace" with the chords G, G7, C, D and Em is guessed
- **THEN** the key is G major

#### Scenario: Spelling is kept
- **WHEN** a sheet with the chords G#, C#, D# and Fm is guessed
- **THEN** the key is G# major, not Ab major

#### Scenario: Minor sheet
- **WHEN** "Greensleeves" with the chords Em, G, D, Bm, C and B7 is guessed
- **THEN** the key is E minor

### Requirement: Moving chords to a key
Moving a sheet to a key SHALL move each chord's root and bass by the same interval as the key. They SHALL be spelled as the new key spells them. A chord's suffix and mark SHALL stay as they are.

#### Scenario: Flats in a flat key
- **WHEN** a sheet in G with the chords G, Cmaj7, D and Em is moved to Bb
- **THEN** its chords are Bb, Ebmaj7, F and Gm

#### Scenario: Bass moves too
- **WHEN** a sheet in G with the chord G/B is moved to A
- **THEN** the chord is A/C#

#### Scenario: Held chord
- **WHEN** a sheet in G with a held C is moved to A
- **THEN** it has a held D
