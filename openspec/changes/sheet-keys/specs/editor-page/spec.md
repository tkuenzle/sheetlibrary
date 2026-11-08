# Spec Delta

## MODIFIED Requirements

### Requirement: Key beside the title
The page SHALL show the sheet's key on a button beside the heading, at every width. The key is the set key, or, without one, the key guessed from the chords. The button SHALL follow the sheet: after an edit or a transpose, it shows the sheet's key then. A sheet without chords and without a set key SHALL have no key button.

#### Scenario: Seed song's key
- **WHEN** a visitor opens `/editor`
- **THEN** a button reading "Key G" sits beside the heading "Amazing Grace"

#### Scenario: No chords
- **WHEN** a visitor removes every chord of the seed song
- **THEN** the key button is gone, and it comes back with the first new chord

### Requirement: Transposing from the key button
The key button SHALL open a panel in two parts. "Song key" SHALL show the sheet's key, and say it is guessed from the chords while no key is set. "Transpose to" SHALL hold the keys to move to, with the current key marked, and a step down and a step up by one semitone. On a phone, the panel SHALL be a bottom sheet. Picking a key or a step SHALL move the chords right away and keep the panel open. Escape, a click outside or the key button SHALL close it.

#### Scenario: Picking a key
- **WHEN** a visitor opens the key button and picks A
- **THEN** the seed song's G, C and D read A, D and E, the button reads "Key A", and the panel is still open, with the song key A, guessed from the chords, and "Back to G"

#### Scenario: Stepping
- **WHEN** a visitor opens the key button and steps up twice
- **THEN** the button reads "Key A"

## ADDED Requirements

### Requirement: Setting the song's key
Beside the song key, the panel SHALL offer "Change". It SHALL say that the chords stay as they are, name the key guessed from the chords when the sheet has chords, and list the major and the minor keys, with the sheet's key marked. Picking one SHALL set it as the sheet's key and as the original key, the one "Back" goes to, without moving any chord. Cancel SHALL keep the key as it was.

#### Scenario: Seed song in E minor
- **WHEN** a visitor opens the key button, selects "Change" and picks Em
- **THEN** the chords are unchanged, the button reads "Key Em", the song key is Em and not said to be guessed, and "Back to Em" is disabled

#### Scenario: Guess shown after setting
- **WHEN** a visitor sets the seed song's key to Em and selects "Change" again
- **THEN** it says the key guessed from the chords is G, and Em is marked

#### Scenario: Edits after setting
- **WHEN** a visitor sets the seed song's key to Em and then removes every chord
- **THEN** the button still reads "Key Em"
