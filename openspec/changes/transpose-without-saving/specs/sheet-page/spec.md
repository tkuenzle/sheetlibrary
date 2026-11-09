# Spec Delta

## MODIFIED Requirements

### Requirement: Edits save on their own
Edits SHALL save on their own, shortly after the person stops typing. While the person keeps typing, the edits SHALL still save at least every 5 seconds. Setting the sheet's key, and making the shown key the song key, SHALL save like any other edit. A transpose SHALL NOT save, and SHALL NOT count as an edit. A reload after a save SHALL show the saved sheet.

#### Scenario: Reload after editing
- **WHEN** the owner changes a chord, waits until it is saved and reloads
- **THEN** the page shows the changed chord

#### Scenario: Typing without a pause
- **WHEN** the owner types for 12 seconds without pausing
- **THEN** their edits are saved while they type, at most 5 seconds apart

#### Scenario: Reload after setting the key
- **WHEN** the owner sets the key of a sheet guessed as G to Em, waits until it is saved and reloads
- **THEN** the key button reads "Key Em", and the panel doesn't say the key is guessed

#### Scenario: Transpose isn't saved
- **WHEN** the owner moves a saved sheet in G to A and then opens it from the library
- **THEN** the save state said "Saved" throughout, and the sheet opens in G

#### Scenario: Reload after making the song key
- **WHEN** the owner moves a sheet in G to A, picks "Make A the song key", waits until it is saved and reloads
- **THEN** the chords are in A, and the panel shows the song key A

## ADDED Requirements

### Requirement: Transposing a read-only sheet
After the sheet changed in another tab or was deleted, the key button SHALL still show the sheet in another key. "Change" and "Make … the song key" SHALL be disabled.

#### Scenario: Transposing after a conflict
- **WHEN** the sheet has become read-only because it changed in another tab, and the owner picks A in the key panel
- **THEN** the chords read in A, and "Change" is disabled
