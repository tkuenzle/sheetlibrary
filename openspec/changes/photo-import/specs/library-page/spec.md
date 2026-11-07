# Spec Delta

## MODIFIED Requirements

### Requirement: Import from Ultimate Guitar
"Import" SHALL sit beside "New sheet" and open a menu with "From photos…" and "From Ultimate Guitar…". "From Ultimate Guitar…" SHALL open a dialog to paste text copied from Ultimate Guitar. Importing SHALL read the text as the import on `/editor` does, create a sheet titled "Untitled" with what it read, and open it at `/sheets/:id` with the title field open and "Untitled" selected. The dialog SHALL NOT say that a sheet is replaced.

#### Scenario: Importing a song
- **WHEN** a person selects "Import", then "From Ultimate Guitar…", pastes the chords and lyrics of "Amazing Grace" and selects "Import" in the dialog
- **THEN** a sheet opens with those chords and lyrics, the heading "Untitled" and the title field open, and the library lists "Untitled" first

#### Scenario: Cancelling
- **WHEN** a person selects "Import", then "From Ultimate Guitar…", pastes text and selects "Cancel"
- **THEN** the dialog closes and the library has no new sheet

## ADDED Requirements

### Requirement: Import from photos
"From photos…" SHALL open a dialog to take or pick a photo of each page of a song. Importing SHALL read the photos, create a sheet with what was read, and open it at `/sheets/:id`. The photos SHALL NOT be kept.

#### Scenario: Importing photos
- **WHEN** a person selects "Import", then "From photos…", adds two photos of "Amazing Grace" and selects "Import"
- **THEN** a sheet opens with the chords and lyrics read from the photos, and the library lists it first

### Requirement: The photos in the dialog
The dialog SHALL list the photos as pages, in the order they were added. "Add photos" SHALL add more at the end, up to 10 pages, and each page SHALL have a button to remove it. Import SHALL be disabled while there is no page.

#### Scenario: Removing a page
- **WHEN** a person adds three photos and removes page 2
- **THEN** the dialog lists two pages, the first and the third photo, as page 1 and page 2

#### Scenario: Ten pages
- **WHEN** a person has added 10 photos
- **THEN** "Add photos" is disabled

### Requirement: A photo that can't be opened
A photo the browser can't open SHALL get a note on its row that says so. Import SHALL be disabled until that photo is removed.

#### Scenario: A HEIC photo on a desktop
- **WHEN** a person adds a photo the browser can't open
- **THEN** its row says the photo can't be opened, and Import is disabled until it is removed

### Requirement: Photos are shrunk before sending
The browser SHALL shrink each photo and turn it upright before sending it.

#### Scenario: A large phone photo
- **WHEN** a person adds a 4032 × 3024 photo taken sideways
- **THEN** the photo sent is upright and no more than about 2236 px on its long edge

### Requirement: Progress while reading
While the photos are sent, the dialog SHALL show how much has been uploaded, in percent. Then, while they are read, it SHALL say "Reading the pages…" with the time so far. The pages SHALL NOT be changed while this runs.

#### Scenario: A slow reading
- **WHEN** the upload is done and the reading has taken 42 seconds
- **THEN** the dialog says "Reading the pages…" and "0:42"

### Requirement: Cancel stops the reading
Cancel, Escape and closing the dialog SHALL work the whole time. They SHALL stop the upload or the reading, and create no sheet.

#### Scenario: Cancelling while reading
- **WHEN** a person selects "Cancel" while the pages are read
- **THEN** the dialog closes, the reading stops, and the library has no new sheet

### Requirement: Reading that didn't work
When the photos couldn't be read, the dialog SHALL stay open with the pages, say that the photos couldn't be read, and create no sheet. Import SHALL try again.

#### Scenario: Trying again
- **WHEN** the reading fails, and the person selects "Import" again
- **THEN** the same photos are read again

### Requirement: The title and artist from the page
The sheet SHALL take the title and the artist read from the photos, and open without the title field. When no title was read, the sheet SHALL be titled "Untitled" and open with the title field open and "Untitled" selected.

#### Scenario: Title read
- **WHEN** the photos are read with the title "Amazing Grace"
- **THEN** the sheet opens with the heading "Amazing Grace" and the title field closed

#### Scenario: No title read
- **WHEN** the photos are read without a title
- **THEN** the sheet opens with the heading "Untitled", the title field open and "Untitled" selected
