# Spec Delta

## ADDED Requirements

### Requirement: The edit bar
In edit mode, the top bar SHALL hold "Done" and the save state, then at its end the help button "How to edit" and the sheet's menu, the same at every width.

#### Scenario: Opening edit mode
- **WHEN** the owner picks "Edit" on the play view
- **THEN** the top bar holds "Done", the save state, "How to edit" and "More for this sheet"

### Requirement: Done
"Done" SHALL save the edits that aren't saved yet, then go back to the play view, with the key and the capo shown now, without loading the page in full. The play view SHALL show the edits. The browser's back in edit mode SHALL do the same.

#### Scenario: Back to playing
- **WHEN** the owner changes a chord and picks "Done" at once
- **THEN** the play view shows the changed chord, and a reload shows it too

#### Scenario: The browser's back
- **WHEN** the owner opens a sheet to play, picks "Edit", shows the sheet in A and presses the browser's back
- **THEN** the play view shows again, with the sheet in A

#### Scenario: Back from the play view after editing
- **WHEN** the owner opens a sheet from Sheets, picks "Edit", then "Done", then Back
- **THEN** Sheets shows again

### Requirement: Rename button
A button named "Rename" beside the title SHALL open the title field, as a click on the title does.

#### Scenario: Renaming with the button
- **WHEN** the owner picks "Rename" beside the title
- **THEN** the title field opens, with the title in it

### Requirement: How to edit, the first time
In edit mode, a note SHALL say how to edit, for the main pointer, with "All shortcuts", which opens the help, and "Got it", which closes the note. After "Got it", the note SHALL NOT show again on this device, also after a reload.

#### Scenario: Got it
- **WHEN** the owner opens edit mode for the first time on this device, picks "Got it", then opens edit mode on another sheet
- **THEN** the note showed the first time and doesn't show the second time

### Requirement: Help behind a button
At every width, "How to edit" SHALL open the help as a modal panel from the edge. Escape, its close button or a click outside it SHALL close it, and focus SHALL go back to the button. Edit mode SHALL NOT show the help beside the editor.

#### Scenario: Help on a wide screen
- **WHEN** the owner opens edit mode in a window 1280px wide and picks "How to edit"
- **THEN** the help opens over the page, and before that no help showed beside the editor

## MODIFIED Requirements

### Requirement: Stored sheet in the editor
The page at `/sheets/:id/edit` SHALL show the owner's sheet in edit mode: in the chord editor, centred on the page, with its title as the heading and in the browser tab, its artist below the title, and the key button and the capo button. It SHALL NOT show the prototype notice or the Ultimate Guitar import.

#### Scenario: Opening a sheet
- **WHEN** the owner opens `/sheets/:id/edit` for their sheet "Amazing Grace" by Chris Tomlin
- **THEN** the editor shows that sheet, the heading reads "Amazing Grace" with "Chris Tomlin" below it, and the tab reads "Amazing Grace | Sheet Library"

### Requirement: Changed in another tab
When a save is refused because the sheet was saved elsewhere since it was loaded, the page SHALL stop saving, make the editor, the title and the artist read-only, disable "Rename" and say "This sheet changed in another tab. Reload to see it." The page SHALL NOT replace the person's edits with the newer sheet.

#### Scenario: Two tabs
- **WHEN** the same sheet is open in two tabs, the first saves an edit and then the second tries to save
- **THEN** the second tab becomes read-only, shows the notice and keeps its own edits on screen

#### Scenario: Renaming after a conflict
- **WHEN** the second tab has become read-only and the owner clicks the title
- **THEN** no field opens, and "Rename" beside the title is disabled

### Requirement: Warning before leaving unsaved edits
Leaving edit mode inside the app, with "Done", the browser's back or a link, SHALL first save the edits that aren't saved yet, and then leave. When that save fails, the page SHALL stay and ask whether to leave without them. After the sheet changed in another tab or was deleted, it SHALL leave without asking. A reload or closing the tab while edits aren't saved yet SHALL ask with the browser's own prompt.

#### Scenario: Leaving after the save
- **WHEN** the owner edits, waits until it is saved and reloads
- **THEN** the browser doesn't ask to confirm

#### Scenario: Going back while offline
- **WHEN** the owner edits while the network is down and presses the browser's back
- **THEN** edit mode stays and asks whether to leave without the edits

### Requirement: Deleting a sheet
"Delete" SHALL first ask to confirm, naming the sheet and saying it can't be undone. Confirming SHALL delete the sheet, with any edits not saved yet, and leave it as Back on the play view does. Cancel SHALL keep the sheet. "Delete" SHALL stay available after the sheet changed in another tab. If the sheet is already gone, confirming SHALL leave it the same way.

#### Scenario: Deleting
- **WHEN** the owner opens "Amazing Grace" from Sheets, picks "Edit", then "Delete" in the menu, and confirms
- **THEN** Sheets shows again and doesn't list "Amazing Grace"

#### Scenario: Cancelling
- **WHEN** the owner picks "Delete" and then "Cancel"
- **THEN** the sheet stays open and is still in the library

### Requirement: Deleted elsewhere
When a save finds that the sheet was deleted, the page SHALL stop saving, make the editor, the title and the artist read-only, and disable "Rename" and "Delete". The save state SHALL say "Not saved", and a note SHALL say "This sheet was deleted." with a link to the library. The person's edits SHALL stay on screen.

#### Scenario: Deleted in another tab
- **WHEN** the same sheet is open in two tabs, the first deletes it and then the second tries to save an edit
- **THEN** the second tab becomes read-only, shows the note with the link to the library, disables "Rename" beside the title and keeps its edits on screen

## REMOVED Requirements

### Requirement: The sheet's menu
**Reason**: The menu loses "Rename" and becomes the same in both modes.
**Migration**: The menu is specified once, in `play-page` ("The sheet's menu on the play view"). The title is renamed with "Rename" beside it, or a click on it.
