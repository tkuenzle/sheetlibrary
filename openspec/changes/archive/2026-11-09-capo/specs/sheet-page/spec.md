# Spec Delta

## MODIFIED Requirements

### Requirement: Stored sheet in the editor
The page at `/sheets/:id` SHALL show the owner's sheet in the chord editor, with its title as the heading and in the browser tab, its artist below the title, the key button, the capo button and the help, as on `/editor`. It SHALL NOT show the prototype notice or the Ultimate Guitar import.

#### Scenario: Opening a sheet
- **WHEN** the owner opens `/sheets/:id` for their sheet "Amazing Grace" by Chris Tomlin
- **THEN** the editor shows that sheet, the heading reads "Amazing Grace" with "Chris Tomlin" below it, and the tab reads "Amazing Grace | Sheet Library"

### Requirement: Edits save on their own
Edits SHALL save on their own, shortly after the person stops typing. While the person keeps typing, the edits SHALL still save at least every 5 seconds. Setting the sheet's key, and making the shown key the song key, SHALL save like any other edit. A transpose or a capo SHALL NOT save, and SHALL NOT count as an edit. A reload after a save SHALL show the saved sheet.

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

#### Scenario: Capo isn't saved
- **WHEN** the owner picks capo 2 on a saved sheet and then opens it from the library
- **THEN** the save state said "Saved" throughout, and the sheet opens without a capo

#### Scenario: Reload after making the song key
- **WHEN** the owner moves a sheet in G to A, picks "Make A the song key", waits until it is saved and reloads
- **THEN** the chords are in A, and the panel shows the song key A
