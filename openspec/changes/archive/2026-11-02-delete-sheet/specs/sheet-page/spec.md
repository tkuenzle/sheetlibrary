# Spec Delta

## MODIFIED Requirements

### Requirement: The sheet's menu
A button beside the title SHALL open the sheet's menu. The menu SHALL hold "Rename", which opens the title field, and "Delete". Escape or a click outside SHALL close the menu.

#### Scenario: Rename from the menu
- **WHEN** the owner opens the sheet's menu and picks "Rename"
- **THEN** the title field opens, with the title in it

## ADDED Requirements

### Requirement: Deleting a sheet
"Delete" SHALL first ask to confirm, naming the sheet and saying it can't be undone. Confirming SHALL delete the sheet, with any edits not saved yet, and open the library. Cancel SHALL keep the sheet. "Delete" SHALL stay available after the sheet changed in another tab. If the sheet is already gone, confirming SHALL open the library as well.

#### Scenario: Deleting
- **WHEN** the owner picks "Delete" in the menu of "Amazing Grace" and confirms
- **THEN** the library opens and doesn't list "Amazing Grace"

#### Scenario: Cancelling
- **WHEN** the owner picks "Delete" and then "Cancel"
- **THEN** the sheet stays open and is still in the library

### Requirement: Delete that doesn't get through
When the delete can't reach the server, the confirmation SHALL stay open, say that the sheet couldn't be deleted, and let the owner try again or cancel.

#### Scenario: Offline
- **WHEN** the owner confirms "Delete" while the network is down
- **THEN** the confirmation stays open, says the sheet couldn't be deleted, and the sheet stays open behind it

### Requirement: Deleted elsewhere
When a save finds that the sheet was deleted, the page SHALL stop saving, make the editor, the title and the artist read-only, and disable "Rename" and "Delete". The save state SHALL say "Not saved", and a note SHALL say "This sheet was deleted." with a link to the library. The person's edits SHALL stay on screen.

#### Scenario: Deleted in another tab
- **WHEN** the same sheet is open in two tabs, the first deletes it and then the second tries to save an edit
- **THEN** the second tab becomes read-only, shows the note with the link to the library and keeps its edits on screen
