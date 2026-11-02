# Spec Delta

## Purpose

The page where a signed-in person edits one of their stored sheets. Edits save on their own, and the page says whether they are saved.

## ADDED Requirements

### Requirement: Stored sheet in the editor
The page at `/sheets/:id` SHALL show the owner's sheet in the chord editor, with its title as the heading and in the browser tab, the key button and the help, as on `/editor`. It SHALL NOT show the prototype notice or the Ultimate Guitar import. The title SHALL NOT be editable here.

#### Scenario: Opening a sheet
- **WHEN** the owner opens `/sheets/:id` for their sheet "Amazing Grace"
- **THEN** the editor shows that sheet, the heading reads "Amazing Grace" and the tab reads "Amazing Grace | Sheet Library"

### Requirement: Who can open the page
A visitor who isn't signed in SHALL be sent to the sign-in page. A signed-in person who opens an id that isn't one of their sheets SHALL see a "not found" page. The page SHALL ask search engines not to index it.

#### Scenario: Not signed in
- **WHEN** a visitor who isn't signed in opens `/sheets/:id`
- **THEN** they are sent to the sign-in page

#### Scenario: Someone else's sheet
- **WHEN** a person opens the id of a sheet another person owns
- **THEN** they see a "not found" page

### Requirement: Edits save on their own
Edits SHALL save on their own, shortly after the person stops typing. A transpose SHALL save like any other edit. A reload after a save SHALL show the saved sheet.

#### Scenario: Reload after editing
- **WHEN** the owner changes a chord, waits until it is saved and reloads
- **THEN** the page shows the changed chord

### Requirement: Save state
The page SHALL show whether the edits are saved: while a save is under way, once everything is saved, and when a save failed. When a save fails because the network or server can't be reached, the page SHALL say it is not saved, keep the editor editable and keep trying.

#### Scenario: Offline
- **WHEN** the owner edits while the network is down
- **THEN** the page says the edits aren't saved, and saves them once the network is back

### Requirement: Changed in another tab
When a save is refused because the sheet was saved elsewhere since it was loaded, the page SHALL stop saving, make the editor read-only and say "This sheet changed in another tab. Reload to see it." The page SHALL NOT replace the person's edits with the newer sheet.

#### Scenario: Two tabs
- **WHEN** the same sheet is open in two tabs, the first saves an edit and then the second tries to save
- **THEN** the second tab becomes read-only, shows the notice and keeps its own edits on screen

### Requirement: Warning before leaving unsaved edits
While edits aren't saved yet, leaving the page SHALL first ask the person to confirm, with the browser's own prompt. When everything is saved, leaving SHALL NOT ask.

#### Scenario: Leaving after the save
- **WHEN** the owner edits, waits until it is saved and reloads
- **THEN** the browser doesn't ask to confirm
