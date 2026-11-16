# play-page Specification

## Purpose

The page where the owner of a sheet plays it or prints it: the sheet in large text without editing tools, with a key, a capo and a text size that change only what is shown.

## Requirements

### Requirement: A sheet to play
The page at `/sheets/:id` SHALL show the owner's sheet with the read-only sheet view, centred on the page, its title as the heading and in the browser tab, and its artist below the title. The lyrics SHALL be larger than in the editor. The page SHALL NOT show editing tools, the save state or the help.

#### Scenario: Opening a sheet
- **WHEN** the owner opens `/sheets/:id` for their sheet "Amazing Grace" by John Newton
- **THEN** the heading reads "Amazing Grace" with "John Newton" below it, the tab reads "Amazing Grace | Sheet Library", and a click on the lyrics doesn't start editing

### Requirement: Who can open the play view
A visitor who isn't signed in SHALL be sent to the sign-in page. A signed-in person who opens an id that isn't one of their sheets SHALL see a "not found" page. The page SHALL ask search engines not to index it.

#### Scenario: Someone else's sheet
- **WHEN** a person opens `/sheets/:id` for a sheet another person owns
- **THEN** they see a "not found" page

### Requirement: Complete before JavaScript
The page SHALL show the sheet complete from its HTML and CSS, in the key and with the capo its address holds.

#### Scenario: Opened in another key
- **WHEN** the owner opens `/sheets/:id?key=A&capo=2` for a sheet in G, with JavaScript turned off
- **THEN** the chords show the shapes for capo 2 in A, and the key button reads "Key A · +2"

### Requirement: The play bar
The top bar of the play view SHALL hold Back, then at its end "View", "Edit" and the sheet's menu, the same at every width. "Edit" SHALL be a button with its name, and only its icon on a phone, still named "Edit".

#### Scenario: On a wide screen
- **WHEN** the owner opens a sheet to play on a wide screen
- **THEN** the top bar holds Back, "View", "Edit" and "More for this sheet", and nothing else

### Requirement: View
"View" SHALL open a panel with the text size, as "Smaller text" and "Larger text", and "Lyrics only" as a switch, on while lyrics only is on. Escape or a click outside SHALL close the panel.

#### Scenario: Lyrics only from View
- **WHEN** the owner opens "View" and turns on "Lyrics only"
- **THEN** the chords go away, and the switch is on the next time "View" opens

### Requirement: Edit from the play view
"Edit" SHALL open the sheet in edit mode at `/sheets/:id/edit`, with the key and the capo shown now, without loading the page in full.

#### Scenario: From playing to editing
- **WHEN** the owner shows a sheet in A with capo 2 on the play view and picks "Edit"
- **THEN** edit mode opens with the sheet in A and capo 2

### Requirement: The sheet's menu on the play view
The menu "More for this sheet" SHALL hold "Choose collections…", "Print" and "Delete". It SHALL be the same in edit mode. Escape or a click outside SHALL close it.

#### Scenario: Printing from the menu
- **WHEN** the owner opens "More for this sheet" and picks "Print"
- **THEN** the browser's print opens

#### Scenario: The same in edit mode
- **WHEN** the owner opens "More for this sheet" in edit mode
- **THEN** it holds "Choose collections…", "Print" and "Delete", and no "Rename"

### Requirement: Deleting from the play view
"Delete" SHALL ask to confirm, as in edit mode. Confirming SHALL delete the sheet and leave it as Back does. When the delete can't reach the server, the confirmation SHALL stay open and say that the sheet couldn't be deleted.

#### Scenario: Deleting while playing
- **WHEN** the owner opens "Amazing Grace" from Sheets, picks "Delete" in its menu and confirms
- **THEN** Sheets shows again, without "Amazing Grace"

### Requirement: Key and capo for the view only
The play view SHALL have the key button and the capo button, which transpose and set a capo as on the editor page. Their panels SHALL NOT offer to change the song key or to make the shown key the song key. A transpose or a capo SHALL NOT change the stored sheet.

#### Scenario: Transposing to play
- **WHEN** the owner picks A in the key panel of a sheet in G, then opens the sheet in the editor from the library
- **THEN** the play view showed the chords in A, and the editor shows them in G

### Requirement: Without loading the page again
A transpose or a capo on the play view SHALL show the new chords at once, without loading the page again. The chords SHALL get room as in the read-only sheet view. The address SHALL follow the key and the capo, as on the editor page.

#### Scenario: Picking a capo
- **WHEN** the owner picks capo 2 on the play view
- **THEN** the chords show the new shapes without a page load, chord names don't overlap, and the address ends in `?capo=2`

### Requirement: Text size
"Smaller text" and "Larger text" SHALL make the sheet's lyrics and chords smaller or larger, in steps, between a smallest and a largest size. The size SHALL be kept on the device, for every sheet's play view.

#### Scenario: Larger on this device
- **WHEN** the owner picks "Larger text" twice, then opens another sheet's play view
- **THEN** that sheet shows in the larger size too

### Requirement: Printing
"Print" SHALL open the browser's print, which can also save a PDF. The printed page SHALL show the title, the artist, the open version's name and the sheet in the key and with the capo shown. It SHALL NOT show the top bar or the page's buttons.

#### Scenario: Printing in another key
- **WHEN** the owner shows a sheet in G in A and picks "Print"
- **THEN** the print preview shows the title, the artist and the chords in A, and no buttons

#### Scenario: Printing a version
- **WHEN** the owner opens "Anna's key" and picks "Print"
- **THEN** the print preview shows "Anna's key" after the artist

### Requirement: Lyrics only for the view
The play view SHALL have "Lyrics only", which shows the sheet with the view's lyrics only. It SHALL NOT change the stored sheet. While it is on, the key and capo buttons SHALL be hidden. Printing SHALL print the sheet as shown, so with lyrics only it prints the lyrics.

#### Scenario: Turning chords off and on
- **WHEN** the owner shows a sheet in G in A, picks "Lyrics only", then picks it again
- **THEN** the chords and the key and capo buttons go away, then come back with the chords in A

#### Scenario: Printing the lyrics
- **WHEN** the owner picks "Lyrics only" and then "Print"
- **THEN** the print preview shows the title, the artist and the lyrics, without chords

### Requirement: Lyrics only in the address
The address SHALL hold `lyrics` while lyrics only is on, next to `key` and `capo`, and follow the toggle without loading the page again. A page opened with `lyrics` in its address SHALL show lyrics only, complete before JavaScript. While lyrics only is on, the address SHALL keep `key` and `capo`.

#### Scenario: Opened with lyrics only
- **WHEN** the owner opens `/sheets/:id?lyrics&key=A` with JavaScript turned off
- **THEN** the page shows the lyrics without chords

#### Scenario: Address follows
- **WHEN** the owner shows a sheet in A and picks "Lyrics only"
- **THEN** the page doesn't load again, and the address holds `lyrics` and `key=A`

### Requirement: Opening a version
The page at `/sheets/:id?version=…` SHALL show the sheet in the version's key, complete before JavaScript. With `key` next to `version`, it SHALL show the sheet in that key, with the version still open.

#### Scenario: Link to a version
- **WHEN** the owner opens the address of "Anna's key", a version in A of a sheet in G, with JavaScript turned off
- **THEN** the chords are in A, and the key button reads "Key A · Anna's key"

#### Scenario: Version in another key
- **WHEN** the owner opens "Anna's key" with `key=Bb` next to `version`
- **THEN** the chords are in Bb, and the page still shows "Anna's key"

### Requirement: The version's name in the key button
While a version is open, the key button SHALL show its name after the key, such as "Key A · Anna's key". The artist SHALL show alone below the title.

#### Scenario: Name in the key button
- **WHEN** the owner opens "Anna's key", in A, of "Amazing Grace" by John Newton
- **THEN** the key button reads "Key A · Anna's key", and "John Newton" shows below the title alone

### Requirement: A version that is gone
An address with a version that doesn't exist SHALL show the sheet in its song key, without a version, and the address SHALL drop `version`.

#### Scenario: Bookmark after deleting
- **WHEN** the owner opens a bookmark of "Anna's key" after deleting that version
- **THEN** the sheet shows in its song key, and no version's name shows

### Requirement: Saving the first version
On a sheet without versions, the key panel SHALL be as before, with a "…" beside the song key. It SHALL hold "Save A as a version…", named for the key the sheet is shown in.

#### Scenario: No versions yet
- **WHEN** the owner shows a sheet in G without versions in A and opens the "…" beside the song key in the key panel
- **THEN** it holds "Save A as a version…", and the panel lists no versions

### Requirement: Versions in the key panel
On a sheet with versions, the key panel SHALL list them in place of the song key: "Song key" with its key first, then each version with its name and key, in the order they were saved, then "Save A as a version…". The open version, or "Song key" when none is open, SHALL be marked. After about four versions, the list SHALL scroll, and "Save … as a version…" SHALL stay below it.

#### Scenario: Two versions
- **WHEN** the owner opens the key panel of a sheet in G with "Anna's key" in A and "Sunday band" in Bb, shown in A without a version
- **THEN** the panel lists "Song key G", "Anna's key A" and "Sunday band Bb", marks "Song key", and ends with "Save A as a version…"

### Requirement: Picking a version
Picking a version in the list SHALL open it, and picking "Song key" SHALL show the sheet in its song key without a version. The chords SHALL change without loading the page again, and the address SHALL follow.

#### Scenario: Switching versions
- **WHEN** the owner has "Anna's key" open and picks "Sunday band" in the list
- **THEN** the chords are in Bb without a page load, the key button shows "Sunday band", and the address holds its version

### Requirement: Naming a version
"Save A as a version…" SHALL open a dialog with a name field, filled in with "Key A" and selected. "Save" SHALL store the version with that name and the shown key, and open it. "Cancel" or Escape SHALL store nothing.

#### Scenario: Saving with a name
- **WHEN** the owner shows a sheet in A, picks "Save A as a version…", types "Anna's key" and presses Enter
- **THEN** the key button shows "Anna's key", and the list holds "Anna's key A"

#### Scenario: Keeping the suggested name
- **WHEN** the owner picks "Save A as a version…" and presses Enter at once
- **THEN** a version named "Key A" is saved

### Requirement: Another key in a version
Picking another key, or a step, while a version is open SHALL keep the version open and add `key` to the address. "Back to" SHALL name the version's key and return to it.

#### Scenario: Trying another key
- **WHEN** the owner has "Anna's key" in A open and picks Bb
- **THEN** the chords are in Bb, "Anna's key" still shows, and the panel offers "Back to A"

### Requirement: The open version's menu
The open version's row SHALL have a "…" that opens its menu. The menu SHALL hold "Make Bb Anna's key" while the sheet is shown in a key other than the version's, then "Rename…" and "Delete…". Only the open version's row SHALL have the "…".

#### Scenario: In the version's key
- **WHEN** the owner opens the menu of "Anna's key" while the sheet is shown in A, the version's key
- **THEN** it holds only "Rename…" and "Delete…"

### Requirement: Changing a version's key
"Make Bb Anna's key" SHALL store the shown key as the version's key. The address SHALL then drop `key`, and the list SHALL show the new key.

#### Scenario: Anna sings higher
- **WHEN** the owner shows "Anna's key" in Bb and picks "Make Bb Anna's key", then reloads the version's address
- **THEN** the sheet shows in Bb, and the list holds "Anna's key Bb"

### Requirement: Renaming a version
"Rename…" SHALL open the naming dialog with the version's name in it. "Save" SHALL store the new name, and the page and the list SHALL show it.

#### Scenario: Renaming
- **WHEN** the owner picks "Rename…" on "Sunday band", types "Evening band" and picks "Save"
- **THEN** the key button and the list show "Evening band"

### Requirement: Deleting a version
"Delete…" SHALL first ask to confirm, naming the version and saying the sheet stays as it is and that this can't be undone. Confirming SHALL delete the version and show the sheet in the key it was shown in, without a version. "Cancel" SHALL keep it.

#### Scenario: Deleting
- **WHEN** the owner shows "Anna's key" in A, picks "Delete…" in its menu and confirms
- **THEN** the chords stay in A, no version's name shows, and the list no longer holds "Anna's key"

### Requirement: Choose collections
"Choose collections…" SHALL open a dialog that lists the owner's collections A to Z, each with a tick box, ticked for the collections that hold the sheet. Ticking SHALL add the sheet to that collection at once, and unticking SHALL take it out at once. "Done" or Escape SHALL close the dialog.

#### Scenario: Adding to a collection
- **WHEN** the owner opens "Choose collections…" on "Stille Nacht", ticks "Christmas" and selects "Done"
- **THEN** the page of "Christmas" lists "Stille Nacht"

#### Scenario: Already in a collection
- **WHEN** the owner opens "Choose collections…" on a sheet in "Kinderlieder"
- **THEN** "Kinderlieder" shows ticked

### Requirement: New collection from a sheet
The dialog SHALL offer "New collection", which asks for a name as on the Collections tab. "Save" SHALL make the collection with the sheet in it, and the dialog SHALL list it, ticked.

#### Scenario: First collection
- **WHEN** the owner, who has no collections, opens "Choose collections…", selects "New collection" and saves "Christmas"
- **THEN** the dialog lists "Christmas", ticked, and "Christmas" holds the sheet

### Requirement: Collections under the title
In a window wider than 640px, the collections that hold the sheet SHALL show under the title, after the key and capo buttons, each by its name as a link to its page.

#### Scenario: In two collections
- **WHEN** the owner opens "Stille Nacht", which is in "Christmas" and "Campfire", on a wide screen
- **THEN** "Christmas" and "Campfire" show under the title, and "Christmas" opens that collection

#### Scenario: After choosing a collection
- **WHEN** the owner ticks "Kinderlieder" in "Choose collections…" and selects "Done"
- **THEN** "Kinderlieder" shows under the title too
