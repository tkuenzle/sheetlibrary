# Spec Delta

## MODIFIED Requirements

### Requirement: New sheet
"New sheet" SHALL open a menu with three ways to add a sheet: "Write a new sheet", "From photos…" and "From Ultimate Guitar…". "Write a new sheet" SHALL create a sheet titled "Untitled" with no lyrics, and open it in the editor at `/sheets/:id/edit` with the title field open and "Untitled" selected. A reload of that sheet SHALL NOT open the field again.

#### Scenario: Starting a sheet
- **WHEN** a person selects "New sheet", then "Write a new sheet"
- **THEN** the editor opens with the heading "Untitled", and the library lists "Untitled"

#### Scenario: Naming a new sheet
- **WHEN** a person selects "New sheet", then "Write a new sheet", types "Amazing Grace" and presses Enter
- **THEN** the heading reads "Amazing Grace"

### Requirement: No sheets yet
A person without sheets SHALL see "Add your first sheet" instead of the list, with the three ways as cards: "Write it", "From photos" and "From Ultimate Guitar", each with a line that says what it does. Each card SHALL do what the same way in the "New sheet" menu does.

#### Scenario: First sign-in
- **WHEN** a person who has no sheets opens the library
- **THEN** the page says "Add your first sheet" and shows the cards "Write it", "From photos" and "From Ultimate Guitar"

#### Scenario: Writing the first sheet
- **WHEN** a person who has no sheets selects the card "Write it"
- **THEN** the editor opens with the heading "Untitled" and the title field open

### Requirement: Import from Ultimate Guitar
"From Ultimate Guitar…" SHALL open a dialog to paste text copied from Ultimate Guitar. Importing SHALL read the text as the import on `/editor` does, create a sheet titled "Untitled" with what it read, and open it in the editor at `/sheets/:id/edit` with the title field open and "Untitled" selected. The dialog SHALL NOT say that a sheet is replaced.

#### Scenario: Importing a song
- **WHEN** a person selects "New sheet", then "From Ultimate Guitar…", pastes the chords and lyrics of "Amazing Grace" and selects "Import" in the dialog
- **THEN** the editor opens with those chords and lyrics, the heading "Untitled" and the title field open, and the library lists "Untitled"

#### Scenario: Cancelling
- **WHEN** a person selects "New sheet", then "From Ultimate Guitar…", pastes text and selects "Cancel"
- **THEN** the dialog closes and the library has no new sheet

### Requirement: Import from photos
"From photos…" SHALL open a dialog to take or pick a photo of each page of a song. Importing SHALL read the photos, create a sheet with what was read, and open it in the editor at `/sheets/:id/edit`. The photos SHALL NOT be kept.

#### Scenario: Importing photos
- **WHEN** a person selects "New sheet", then "From photos…", adds two photos of "Amazing Grace" and selects "Import"
- **THEN** the editor opens with the chords and lyrics read from the photos, and the library lists it

### Requirement: Sheets and Collections screens
The page at `/sheets` SHALL be headed "Sheets", and the page at `/collections` "Collections". "New sheet" SHALL belong to the navigation, as the `site-layout` capability says, not to a screen. "New collection" SHALL belong to Collections. Neither screen SHALL show a "Library" heading or tabs, or an "Import" button.

#### Scenario: Opening Collections
- **WHEN** a person opens `/collections` in a window 1280px wide
- **THEN** the heading reads "Collections", with "New collection" beside it, and "New sheet" is in the rail

#### Scenario: Opening Sheets
- **WHEN** a person with sheets opens `/sheets` in a window 1280px wide
- **THEN** the heading reads "Sheets", with no button beside it, and "New sheet" is in the rail
