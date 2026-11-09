# sheet-page Specification

## Purpose

The page where a signed-in person edits one of their stored sheets. Edits save on their own, and the page says whether they are saved.

## Requirements

### Requirement: Stored sheet in the editor
The page at `/sheets/:id` SHALL show the owner's sheet in the chord editor, with its title as the heading and in the browser tab, its artist below the title, the key button, the capo button and the help, as on `/editor`. It SHALL NOT show the prototype notice or the Ultimate Guitar import.

#### Scenario: Opening a sheet
- **WHEN** the owner opens `/sheets/:id` for their sheet "Amazing Grace" by Chris Tomlin
- **THEN** the editor shows that sheet, the heading reads "Amazing Grace" with "Chris Tomlin" below it, and the tab reads "Amazing Grace | Sheet Library"

### Requirement: Who can open the page
A visitor who isn't signed in SHALL be sent to the sign-in page. A signed-in person who opens an id that isn't one of their sheets SHALL see a "not found" page. The page SHALL ask search engines not to index it.

#### Scenario: Not signed in
- **WHEN** a visitor who isn't signed in opens `/sheets/:id`
- **THEN** they are sent to the sign-in page

#### Scenario: Someone else's sheet
- **WHEN** a person opens the id of a sheet another person owns
- **THEN** they see a "not found" page

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

### Requirement: Changed in another tab
When a save is refused because the sheet was saved elsewhere since it was loaded, the page SHALL stop saving, make the editor, the title and the artist read-only, disable "Rename" and say "This sheet changed in another tab. Reload to see it." The page SHALL NOT replace the person's edits with the newer sheet.

#### Scenario: Two tabs
- **WHEN** the same sheet is open in two tabs, the first saves an edit and then the second tries to save
- **THEN** the second tab becomes read-only, shows the notice and keeps its own edits on screen

#### Scenario: Renaming after a conflict
- **WHEN** the second tab has become read-only and the owner clicks the title
- **THEN** no field opens

### Requirement: Warning before leaving unsaved edits
While edits aren't saved yet, leaving the page SHALL first ask the person to confirm, with the browser's own prompt. When everything is saved, leaving SHALL NOT ask.

#### Scenario: Leaving after the save
- **WHEN** the owner edits, waits until it is saved and reloads
- **THEN** the browser doesn't ask to confirm

### Requirement: Renaming in place
A click on the title SHALL turn it into a field that takes up to 100 characters. Enter or a click elsewhere SHALL keep the text, trimmed; Escape SHALL keep the old title. A title that is empty once trimmed SHALL become "Untitled". The heading and the browser tab SHALL show the kept title.

#### Scenario: Renaming
- **WHEN** the owner clicks the title "Untitled", types "Amazing Grace" and presses Enter
- **THEN** the heading and the tab show "Amazing Grace"

#### Scenario: Clearing the title
- **WHEN** the owner clears the title field and clicks elsewhere
- **THEN** the title is "Untitled"

### Requirement: Artist in place
A sheet without an artist SHALL show "Add artist" below the title. A click on it, or on the artist, SHALL turn it into a field that keeps and cancels like the title's. An artist that is empty once trimmed SHALL be removed, and "Add artist" SHALL show again.

#### Scenario: Adding an artist
- **WHEN** the owner clicks "Add artist", types "Chris Tomlin" and presses Enter
- **THEN** "Chris Tomlin" shows below the title

#### Scenario: Removing the artist
- **WHEN** the owner clears the artist field and presses Enter
- **THEN** the sheet has no artist and "Add artist" shows

### Requirement: Details save with the sheet
A kept title or artist SHALL save like any other edit and show in the save state. A reload after the save SHALL show it, and so SHALL the library. Undo in the editor SHALL NOT undo a rename.

#### Scenario: Reload after renaming
- **WHEN** the owner renames the sheet, waits until it is saved and reloads
- **THEN** the page shows the new title

#### Scenario: Undo after renaming
- **WHEN** the owner types in a section, renames the sheet and presses undo in the editor
- **THEN** the typing is undone and the new title stays

### Requirement: The sheet's menu
A button beside the title SHALL open the sheet's menu. The menu SHALL hold "Rename", which opens the title field, and "Delete". Escape or a click outside SHALL close the menu.

#### Scenario: Rename from the menu
- **WHEN** the owner opens the sheet's menu and picks "Rename"
- **THEN** the title field opens, with the title in it

### Requirement: Help for renaming
The sheet page's help SHALL say that a click on the title, or a tap with touch, renames the sheet. The help on `/editor` SHALL NOT say it.

#### Scenario: Help on the sheet page
- **WHEN** the owner reads the help on `/sheets/:id` with a mouse
- **THEN** it says to click the title to rename the sheet

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
### Requirement: Transposing a read-only sheet
After the sheet changed in another tab or was deleted, the key button SHALL still show the sheet in another key. "Change" and "Make … the song key" SHALL be disabled.

#### Scenario: Transposing after a conflict
- **WHEN** the sheet has become read-only because it changed in another tab, and the owner picks A in the key panel
- **THEN** the chords read in A, and "Change" is disabled
