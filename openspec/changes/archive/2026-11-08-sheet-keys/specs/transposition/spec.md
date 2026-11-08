# Spec Delta

## ADDED Requirements

### Requirement: Set key before the guess
A sheet's key SHALL be the key set in it. Only a sheet without a set key SHALL have its key guessed from its chords. A set key SHALL stay after the chords change.

#### Scenario: Set key wins
- **WHEN** a sheet whose chords are guessed as G major has the key E minor set
- **THEN** its key is E minor

#### Scenario: Chords change
- **WHEN** a sheet with the key G set gets the chords of another song in A
- **THEN** its key is still G

### Requirement: Set key moves with the chords
Moving a sheet with a set key to another key SHALL set the new key too. A sheet without a set key SHALL still have none after a move.

#### Scenario: Moving a set key
- **WHEN** a sheet with the key G set is moved to A
- **THEN** its chords are in A, and its set key is A

#### Scenario: No set key
- **WHEN** a sheet without a set key is moved from G to A
- **THEN** it still has no set key, and its key is guessed as A
