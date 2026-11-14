# library-page Specification

## Purpose

The library at `/sheets`: where a signed-in person finds their sheets and starts a new one.

## Requirements

### Requirement: My sheets
The page at `/sheets` SHALL list the signed-in person's sheets and no one else's. Without a search, it SHALL list all of them, the most recently edited first; while searching, it SHALL list only the results, as the `library-search` capability says. Each row SHALL show the sheet's title, its artist if it has one, and when it was last edited. A row SHALL open the sheet to play at `/sheets/:id`.

#### Scenario: Newest edit first
- **WHEN** a person has the sheets "Amazing Grace" and "Hallelujah", and last edited "Hallelujah"
- **THEN** the library lists "Hallelujah" first, then "Amazing Grace"

#### Scenario: Someone else's sheets
- **WHEN** another person has a sheet "Shenandoah"
- **THEN** it doesn't appear in this person's library

#### Scenario: Opening a sheet
- **WHEN** a person selects the row "Amazing Grace"
- **THEN** the play view of "Amazing Grace" opens, not the editor

#### Scenario: While searching
- **WHEN** a person has "Amazing Grace" and "Hallelujah", and searches "grace"
- **THEN** the library lists only "Amazing Grace"

### Requirement: When a sheet was last edited
A row SHALL say "Today" or "Yesterday" for a sheet last edited on those days, in the viewer's time zone. Otherwise it SHALL show the day and month, such as "28 Oct", and the year too when it isn't the current year.

#### Scenario: Edited earlier this year
- **WHEN** it is 2 November 2026 and a sheet was last edited on 28 October 2026
- **THEN** its row says "28 Oct"

### Requirement: New sheet
"New sheet" SHALL create a sheet titled "Untitled" with no lyrics, and open it in the editor at `/sheets/:id/edit` with the title field open and "Untitled" selected. A reload of that sheet SHALL NOT open the field again.

#### Scenario: Starting a sheet
- **WHEN** a person selects "New sheet"
- **THEN** the editor opens with the heading "Untitled", and the library lists "Untitled" first

#### Scenario: Naming a new sheet
- **WHEN** a person selects "New sheet", types "Amazing Grace" and presses Enter
- **THEN** the heading reads "Amazing Grace"

### Requirement: No sheets yet
A person without sheets SHALL see "No sheets yet", "Import" and "New sheet" instead of the list.

#### Scenario: First sign-in
- **WHEN** a person who has no sheets opens the library
- **THEN** the page says "No sheets yet" and offers "Import" and "New sheet"

### Requirement: Import from Ultimate Guitar
"Import" SHALL sit beside "New sheet" and open a menu with "From photos…" and "From Ultimate Guitar…". "From Ultimate Guitar…" SHALL open a dialog to paste text copied from Ultimate Guitar. Importing SHALL read the text as the import on `/editor` does, create a sheet titled "Untitled" with what it read, and open it in the editor at `/sheets/:id/edit` with the title field open and "Untitled" selected. The dialog SHALL NOT say that a sheet is replaced.

#### Scenario: Importing a song
- **WHEN** a person selects "Import", then "From Ultimate Guitar…", pastes the chords and lyrics of "Amazing Grace" and selects "Import" in the dialog
- **THEN** the editor opens with those chords and lyrics, the heading "Untitled" and the title field open, and the library lists "Untitled" first

#### Scenario: Cancelling
- **WHEN** a person selects "Import", then "From Ultimate Guitar…", pastes text and selects "Cancel"
- **THEN** the dialog closes and the library has no new sheet

### Requirement: Import too large
When the text makes a sheet larger than a sheet can be, the dialog SHALL stay open with the text, say that it is too long to import, and create no sheet.

#### Scenario: Too large
- **WHEN** a person pastes text that makes a sheet larger than a sheet can be, and selects "Import"
- **THEN** the dialog stays open and says the text is too long to import

### Requirement: Who can open the library
A visitor who isn't signed in SHALL be sent to the sign-in page. The page SHALL ask search engines not to index it.

#### Scenario: Not signed in
- **WHEN** a visitor who isn't signed in opens `/sheets`
- **THEN** they are sent to the sign-in page

### Requirement: Import from photos
"From photos…" SHALL open a dialog to take or pick a photo of each page of a song. Importing SHALL read the photos, create a sheet with what was read, and open it in the editor at `/sheets/:id/edit`. The photos SHALL NOT be kept.

#### Scenario: Importing photos
- **WHEN** a person selects "Import", then "From photos…", adds two photos of "Amazing Grace" and selects "Import"
- **THEN** the editor opens with the chords and lyrics read from the photos, and the library lists it first

### Requirement: The photos in the dialog
The dialog SHALL list the photos as pages, in the order they were added. "Pick photos" SHALL add more at the end, up to 10 pages, and each page SHALL have a button to remove it. Import SHALL be disabled while there is no page.

#### Scenario: Removing a page
- **WHEN** a person adds three photos and removes page 2
- **THEN** the dialog lists two pages, the first and the third photo, as page 1 and page 2

#### Scenario: Ten pages
- **WHEN** a person has added 10 photos
- **THEN** "Pick photos" and "Take photo" are disabled

### Requirement: Take a photo with the camera
Where the browser can take a photo from the page, as on phones and tablets, the dialog SHALL show "Take photo" before "Pick photos", and give it more weight. It SHALL open the back camera, and add the photo taken as the next page. Where the browser can't, as on a desktop, the dialog SHALL show only "Pick photos".

#### Scenario: On an Android phone
- **WHEN** a person on an Android phone has added two pages and takes a photo with "Take photo"
- **THEN** the photo is listed as page 3

#### Scenario: On a desktop
- **WHEN** a person opens the dialog on a desktop
- **THEN** it shows "Pick photos" and no "Take photo"

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

### Requirement: Importing with a capo
With a capo under "Written for", the imported sheet SHALL open with that capo.

#### Scenario: Importing with a capo
- **WHEN** a person imports "Amazing Grace" in G from Ultimate Guitar, with "Capo 2" under "Written for", and later opens it from the library
- **THEN** it first opens with "Capo 2" and the chords as pasted, and from the library it opens in A without a capo

### Requirement: My collections
The page at `/collections` SHALL list the signed-in person's collections and no one else's, A to Z by name. Each row SHALL show the name and how many sheets the collection holds, and SHALL open the collection at `/collections/:id`. A visitor who isn't signed in SHALL be sent to the sign-in page, and the page SHALL ask search engines not to index it.

#### Scenario: A to Z
- **WHEN** a person has the collections "Kinderlieder" with 31 sheets and "Christmas" with 14
- **THEN** the page lists "Christmas" with "14 sheets", then "Kinderlieder" with "31 sheets"

#### Scenario: Not signed in
- **WHEN** a visitor who isn't signed in opens `/collections`
- **THEN** they are sent to the sign-in page

### Requirement: No collections yet
A person without collections SHALL see "No collections yet" and "New collection" on `/collections` instead of the list.

#### Scenario: First visit
- **WHEN** a person who has no collections opens `/collections`
- **THEN** it says "No collections yet" and offers "New collection"

### Requirement: New collection
"New collection" SHALL open a dialog with a name field. "Save" SHALL make the collection and open its page. A name the person already uses SHALL keep the dialog open, with a note that says so. "Cancel" or Escape SHALL make nothing.

#### Scenario: Making a collection
- **WHEN** a person selects "New collection", types "Christmas" and selects "Save"
- **THEN** the empty page of "Christmas" opens

#### Scenario: Name in use
- **WHEN** a person who has "Christmas" makes a collection named "Christmas"
- **THEN** the dialog stays open and says the name is already used

### Requirement: Sheets and Collections screens
The page at `/sheets` SHALL be headed "Sheets", and the page at `/collections` "Collections". "Import" and "New sheet" SHALL belong to Sheets, and "New collection" to Collections. Neither SHALL show a "Library" heading or tabs.

#### Scenario: Opening Collections
- **WHEN** a person opens `/collections`
- **THEN** the heading reads "Collections", with "New collection" and without "Import" or "New sheet"

#### Scenario: Opening Sheets
- **WHEN** a person with sheets opens `/sheets`
- **THEN** the heading reads "Sheets", with "Import" and "New sheet"
