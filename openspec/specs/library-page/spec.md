# library-page Specification

## Purpose

The library at `/sheets`: where a signed-in person finds their sheets and starts a new one.

## Requirements

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

### Requirement: Recent sheets
Sheets SHALL show a "Recent" row between the search field and the list, with the 4 sheets the person opened last, the last opened first. Each SHALL show as a card with its title, its artist if it has one, and its key as the list shows it. A card SHALL open the sheet to play, and SHALL have no menu. Deleting a sheet from its row SHALL take its card away at once, with the row. On a phone, the cards SHALL be a row that scrolls sideways.

#### Scenario: Opened last
- **WHEN** a person opens "Amazing Grace", then "Stille Nacht", and goes back to Sheets
- **THEN** "Recent" shows "Stille Nacht" first, then "Amazing Grace"

#### Scenario: More than 4 opened
- **WHEN** a person has opened 6 sheets
- **THEN** "Recent" shows the 4 opened last

#### Scenario: Deleting a recent sheet
- **WHEN** a person deletes "Stille Nacht" from its row while it is in "Recent"
- **THEN** its row and its card go away at once

### Requirement: Recent's cards have one height
Every card in "Recent" SHALL have the same height, with room for two lines of title, the artist and the key, whether the sheet has them or not. Its bars, while "Recent" loads, SHALL take the same room.

#### Scenario: Cards of one height
- **WHEN** "Recent" shows "Amazing Grace" with an artist and a key, and a sheet with a short title and neither
- **THEN** both cards have the same height, and so do the bars that stand for them

### Requirement: What counts as opening a sheet
Opening a sheet's play view at `/sheets/:id` SHALL count as opening it, for that person. Opening the editor at `/sheets/:id/edit` SHALL NOT count.

#### Scenario: Editing only
- **WHEN** a person who has opened nothing makes a new sheet, which opens in the editor, and goes back to Sheets
- **THEN** no "Recent" row is shown

### Requirement: When Recent is hidden
The "Recent" row SHALL be hidden while searching, and when the person hasn't opened any sheet yet.

#### Scenario: Searching
- **WHEN** a person who has opened "Amazing Grace" searches "grace"
- **THEN** no "Recent" row is shown, only the results

### Requirement: All sheets heading
Without a search, the list on Sheets SHALL have the heading "All sheets" with how many sheets the person has, such as "All sheets 48", on the line of the order control. While searching, the heading SHALL be hidden. A sheet deleted from its row SHALL leave the count at once, and come back to it if the delete doesn't get through.

#### Scenario: Counting the sheets
- **WHEN** a person with 48 sheets opens Sheets
- **THEN** the list is headed "All sheets 48"

#### Scenario: Deleting a sheet
- **WHEN** a person with 48 sheets deletes one from its row
- **THEN** the heading says "All sheets 47" at once

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
- **WHEN** a person selects "New sheet", then "From photos…", adds two photos of "Amazing Grace" and selects "Import"
- **THEN** the editor opens with the chords and lyrics read from the photos, and the library lists it

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
The page at `/sheets` SHALL be headed "Sheets", and the page at `/collections` "Collections". "New sheet" SHALL belong to the navigation, as the `site-layout` capability says, not to a screen. "New collection" SHALL belong to Collections. Neither screen SHALL show a "Library" heading or tabs, or an "Import" button.

#### Scenario: Opening Collections
- **WHEN** a person opens `/collections` in a window 1280px wide
- **THEN** the heading reads "Collections", with "New collection" beside it, and "New sheet" is in the rail

#### Scenario: Opening Sheets
- **WHEN** a person with sheets opens `/sheets` in a window 1280px wide
- **THEN** the heading reads "Sheets", with no button beside it, and "New sheet" is in the rail
