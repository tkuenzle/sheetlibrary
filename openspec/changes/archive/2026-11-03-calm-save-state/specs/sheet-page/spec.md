# Spec Delta

## MODIFIED Requirements

### Requirement: Edits save on their own
Edits SHALL save on their own, shortly after the person stops typing. While the person keeps typing, the edits SHALL still save at least every 5 seconds. A transpose SHALL save like any other edit. A reload after a save SHALL show the saved sheet.

#### Scenario: Reload after editing
- **WHEN** the owner changes a chord, waits until it is saved and reloads
- **THEN** the page shows the changed chord

#### Scenario: Typing without a pause
- **WHEN** the owner types for 12 seconds without pausing
- **THEN** their edits are saved while they type, at most 5 seconds apart

### Requirement: Save state
The page SHALL show whether the edits are saved. Once everything has stayed saved for a moment, it SHALL say "Saved". When a save takes longer than a moment, it SHALL say "Saving…". While edits wait for their save, it SHALL say nothing, without moving the page. When a save fails because the network or server can't be reached, the page SHALL say at once that it is not saved, keep the editor editable and keep trying.

#### Scenario: Typing
- **WHEN** the owner types and then stops
- **THEN** the save state says nothing while they type, and "Saved" shortly after they stop

#### Scenario: Slow save
- **WHEN** a save takes a few seconds
- **THEN** the save state says "Saving…" until it is done

#### Scenario: Offline
- **WHEN** the owner edits while the network is down
- **THEN** the page says the edits aren't saved, and saves them once the network is back
