# Spec Delta

## MODIFIED Requirements

### Requirement: Edits save on their own
Edits SHALL save on their own, shortly after the person stops typing. While the person keeps typing, the edits SHALL still save at least every 5 seconds. A transpose, and setting the sheet's key, SHALL save like any other edit. A reload after a save SHALL show the saved sheet.

#### Scenario: Reload after editing
- **WHEN** the owner changes a chord, waits until it is saved and reloads
- **THEN** the page shows the changed chord

#### Scenario: Typing without a pause
- **WHEN** the owner types for 12 seconds without pausing
- **THEN** their edits are saved while they type, at most 5 seconds apart

#### Scenario: Reload after setting the key
- **WHEN** the owner sets the key of a sheet guessed as G to Em, waits until it is saved and reloads
- **THEN** the key button reads "Key Em", and the panel doesn't say the key was guessed
