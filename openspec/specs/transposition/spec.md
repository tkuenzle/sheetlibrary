# transposition Specification

## Purpose
Guesses a chord sheet's key, lists the keys it can move to, and moves its chords to a new key, spelled as that key spells them.

## Requirements

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

### Requirement: Keys to move to
The keys to move to SHALL be one per pitch, spelled with the fewer sharps or flats. Where both spellings have six, both SHALL be listed. A major sheet SHALL list major keys and a minor sheet minor keys.

#### Scenario: Major keys
- **WHEN** the keys for a major sheet are listed
- **THEN** they are C, Db, D, Eb, E, F, F# and Gb, G, Ab, A, Bb and B

#### Scenario: Minor keys
- **WHEN** the keys for a minor sheet are listed
- **THEN** they are Cm, C#m, Dm, D#m and Ebm, Em, Fm, F#m, Gm, G#m, Am, Bbm and Bm

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

### Requirement: Stepping by a semitone
A step up or down SHALL move the sheet one semitone, to the listed key at that pitch. Where two keys are listed, a step SHALL land on F# for major and Ebm for minor.

#### Scenario: Step onto the tie
- **WHEN** a sheet in G is moved one step down
- **THEN** it is in F#

#### Scenario: Minor step onto the tie
- **WHEN** a sheet in Em is moved one step down
- **THEN** it is in Ebm

### Requirement: Respelling
Moving a sheet to the key it is already in, spelled another way, SHALL respell its chords without moving them.

#### Scenario: G# to Ab
- **WHEN** a sheet in G# with the chords G#, C#, D# and Fm is moved to Ab
- **THEN** its chords are Ab, Db, Eb and Fm
