# Spec Delta

## ADDED Requirements

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

### Requirement: Collections under the title
In a window wider than 640px, the collections that hold the sheet SHALL show under the title, after the key and capo buttons, each by its name as a link to its page.

#### Scenario: In two collections
- **WHEN** the owner opens "Stille Nacht", which is in "Christmas" and "Campfire", on a wide screen
- **THEN** "Christmas" and "Campfire" show under the title, and "Christmas" opens that collection

#### Scenario: After choosing a collection
- **WHEN** the owner ticks "Kinderlieder" in "Choose collections…" and selects "Done"
- **THEN** "Kinderlieder" shows under the title too

### Requirement: The version's name in the key button
While a version is open, the key button SHALL show its name after the key, such as "Key A · Anna's key". The artist SHALL show alone below the title.

#### Scenario: Name in the key button
- **WHEN** the owner opens "Anna's key", in A, of "Amazing Grace" by John Newton
- **THEN** the key button reads "Key A · Anna's key", and "John Newton" shows below the title alone

## MODIFIED Requirements

### Requirement: A sheet to play
The page at `/sheets/:id` SHALL show the owner's sheet with the read-only sheet view, centred on the page, its title as the heading and in the browser tab, and its artist below the title. The lyrics SHALL be larger than in the editor. The page SHALL NOT show editing tools, the save state or the help.

#### Scenario: Opening a sheet
- **WHEN** the owner opens `/sheets/:id` for their sheet "Amazing Grace" by John Newton
- **THEN** the heading reads "Amazing Grace" with "John Newton" below it, the tab reads "Amazing Grace | Sheet Library", and a click on the lyrics doesn't start editing

### Requirement: Opening a version
The page at `/sheets/:id?version=…` SHALL show the sheet in the version's key, complete before JavaScript. With `key` next to `version`, it SHALL show the sheet in that key, with the version still open.

#### Scenario: Link to a version
- **WHEN** the owner opens the address of "Anna's key", a version in A of a sheet in G, with JavaScript turned off
- **THEN** the chords are in A, and the key button reads "Key A · Anna's key"

#### Scenario: Version in another key
- **WHEN** the owner opens "Anna's key" with `key=Bb` next to `version`
- **THEN** the chords are in Bb, and the page still shows "Anna's key"

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

### Requirement: Renaming a version
"Rename…" SHALL open the naming dialog with the version's name in it. "Save" SHALL store the new name, and the page and the list SHALL show it.

#### Scenario: Renaming
- **WHEN** the owner picks "Rename…" on "Sunday band", types "Evening band" and picks "Save"
- **THEN** the key button and the list show "Evening band"

## REMOVED Requirements

### Requirement: The version's name on the page
**Reason**: The version's name moves from after the artist into the key button.
**Migration**: See "The version's name in the key button".

### Requirement: Controls on a phone
**Reason**: The bar is the same at every width, so the phone needs no menu of its own.
**Migration**: The text size is in "View", and "Choose collections…" and "Print" are in the sheet's menu, at every width.

### Requirement: Where Lyrics only sits
**Reason**: "Lyrics only" leaves the top bar and the phone menu.
**Migration**: "Lyrics only" is a switch in "View", at every width.

### Requirement: Where Choose collections sits
**Reason**: "Choose collections" leaves the top bar and the phone menu.
**Migration**: "Choose collections…" is in the sheet's menu, at every width.
