# Spec Delta

## MODIFIED Requirements

### Requirement: Renaming a collection
"Rename" SHALL open a dialog with a name field holding the name, selected. "Save" SHALL store the new name, and the heading SHALL show it. A name the owner already uses SHALL keep the dialog open, with a note that says so. "Cancel" or Escape SHALL keep the old name.

#### Scenario: Renaming
- **WHEN** the owner renames "Christmas" to "Weihnachten"
- **THEN** the heading reads "Weihnachten", and so do its row on `/collections` and its entry in the rail

#### Scenario: Name in use
- **WHEN** the owner has "Campfire" and renames "Christmas" to "campfire"
- **THEN** the dialog stays open and says the name is already used

### Requirement: Deleting a collection
"Delete" SHALL first ask to confirm, naming the collection and saying that its sheets stay in the library and that this can't be undone. Confirming SHALL delete the collection and open `/collections`. "Cancel" SHALL keep it.

#### Scenario: Deleting
- **WHEN** the owner deletes "Christmas" and confirms
- **THEN** `/collections` opens without "Christmas", the rail no longer lists it, and its sheets are still in the library
