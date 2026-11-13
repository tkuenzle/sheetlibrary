# Spec Delta

## ADDED Requirements

### Requirement: Add to collection
"Add to collection…" SHALL open a dialog that lists the owner's collections A to Z, each with a tick box, ticked for the collections that hold the sheet. Ticking SHALL add the sheet to that collection at once, and unticking SHALL take it out at once. "Done" or Escape SHALL close the dialog.

#### Scenario: Adding to a collection
- **WHEN** the owner opens "Add to collection…" on "Stille Nacht", ticks "Christmas" and selects "Done"
- **THEN** the page of "Christmas" lists "Stille Nacht"

#### Scenario: Already in a collection
- **WHEN** the owner opens "Add to collection…" on a sheet in "Kinderlieder"
- **THEN** "Kinderlieder" shows ticked

### Requirement: New collection from a sheet
The dialog SHALL offer "New collection", which asks for a name as on the Collections tab. "Save" SHALL make the collection with the sheet in it, and the dialog SHALL list it, ticked.

#### Scenario: First collection
- **WHEN** the owner, who has no collections, opens "Add to collection…", selects "New collection" and saves "Christmas"
- **THEN** the dialog lists "Christmas", ticked, and "Christmas" holds the sheet

### Requirement: Where Add to collection sits
On a wide screen, "Add to collection" SHALL be a button in the top bar, before "Smaller text". On a phone, "Add to collection…" SHALL be in the menu, after "Lyrics only".

#### Scenario: On a wide screen
- **WHEN** the owner opens a sheet to play on a wide screen
- **THEN** the top bar has "Add to collection" before "Smaller text"

## MODIFIED Requirements

### Requirement: Controls on a phone
On a phone, "Add to collection…", "Smaller text", "Larger text" and "Print" SHALL sit in a menu after the key and capo buttons.

#### Scenario: Printing from a phone
- **WHEN** the owner opens the menu on a phone and picks "Print"
- **THEN** the browser's print opens

#### Scenario: Adding from a phone
- **WHEN** the owner opens the menu on a phone and picks "Add to collection…"
- **THEN** the dialog with the owner's collections opens
