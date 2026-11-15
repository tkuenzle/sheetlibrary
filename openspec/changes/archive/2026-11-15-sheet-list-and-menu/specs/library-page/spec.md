# Spec Delta

## MODIFIED Requirements

### Requirement: My sheets
The page at `/sheets` SHALL list the signed-in person's sheets and no one else's. Without a search, it SHALL list all of them, in the order the `sheet-list` capability says; while searching, it SHALL list only the results, as the `library-search` capability says. Its rows and their menus SHALL be those of the `sheet-list` capability.

#### Scenario: Newest edit first
- **WHEN** a person who chose "Last edited" has the sheets "Amazing Grace" and "Hallelujah", and last edited "Amazing Grace"
- **THEN** the library lists "Amazing Grace" first, then "Hallelujah"

#### Scenario: Someone else's sheets
- **WHEN** another person has a sheet "Shenandoah"
- **THEN** it doesn't appear in this person's library

#### Scenario: Opening a sheet
- **WHEN** a person selects the row "Amazing Grace"
- **THEN** the play view of "Amazing Grace" opens, not the editor

#### Scenario: While searching
- **WHEN** a person has "Amazing Grace" and "Hallelujah", and searches "grace"
- **THEN** the library lists only "Amazing Grace"

### Requirement: New sheet
"New sheet" SHALL create a sheet titled "Untitled" with no lyrics, and open it in the editor at `/sheets/:id/edit` with the title field open and "Untitled" selected. A reload of that sheet SHALL NOT open the field again.

#### Scenario: Starting a sheet
- **WHEN** a person selects "New sheet"
- **THEN** the editor opens with the heading "Untitled", and the library lists "Untitled"

#### Scenario: Naming a new sheet
- **WHEN** a person selects "New sheet", types "Amazing Grace" and presses Enter
- **THEN** the heading reads "Amazing Grace"

### Requirement: Import from Ultimate Guitar
"Import" SHALL sit beside "New sheet" and open a menu with "From photos…" and "From Ultimate Guitar…". "From Ultimate Guitar…" SHALL open a dialog to paste text copied from Ultimate Guitar. Importing SHALL read the text as the import on `/editor` does, create a sheet titled "Untitled" with what it read, and open it in the editor at `/sheets/:id/edit` with the title field open and "Untitled" selected. The dialog SHALL NOT say that a sheet is replaced.

#### Scenario: Importing a song
- **WHEN** a person selects "Import", then "From Ultimate Guitar…", pastes the chords and lyrics of "Amazing Grace" and selects "Import" in the dialog
- **THEN** the editor opens with those chords and lyrics, the heading "Untitled" and the title field open, and the library lists "Untitled"

#### Scenario: Cancelling
- **WHEN** a person selects "Import", then "From Ultimate Guitar…", pastes text and selects "Cancel"
- **THEN** the dialog closes and the library has no new sheet

### Requirement: Import from photos
"From photos…" SHALL open a dialog to take or pick a photo of each page of a song. Importing SHALL read the photos, create a sheet with what was read, and open it in the editor at `/sheets/:id/edit`. The photos SHALL NOT be kept.

#### Scenario: Importing photos
- **WHEN** a person selects "Import", then "From photos…", adds two photos of "Amazing Grace" and selects "Import"
- **THEN** the editor opens with the chords and lyrics read from the photos, and the library lists it

### Requirement: My collections
The page at `/collections` SHALL show the signed-in person's collections and no one else's, A to Z by name. Each collection SHALL show as a card with its name, how many sheets it holds, and the titles of up to three of its sheets, A to Z. A card SHALL open the collection at `/collections/:id`. A visitor who isn't signed in SHALL be sent to the sign-in page, and the page SHALL ask search engines not to index it.

#### Scenario: A to Z
- **WHEN** a person has the collections "Kinderlieder" with 31 sheets and "Christmas" with 14
- **THEN** the page shows "Christmas" with "14 sheets", then "Kinderlieder" with "31 sheets"

#### Scenario: First titles on a card
- **WHEN** "Christmas" holds "Stille Nacht", "O Tannenbaum", "Drüü Könige" and "Die Könige"
- **THEN** its card shows "Die Könige, Drüü Könige, O Tannenbaum"

#### Scenario: Not signed in
- **WHEN** a visitor who isn't signed in opens `/collections`
- **THEN** they are sent to the sign-in page
