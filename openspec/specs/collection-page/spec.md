# collection-page Specification

## Purpose

The page of one collection at `/collections/:id`: where its owner sees its sheets, adds and removes sheets, and renames or deletes it.

## Requirements

### Requirement: A collection's sheets
The page at `/collections/:id` SHALL show the collection's name as the heading and in the browser tab, how many sheets it holds, such as "14 sheets" or "1 sheet", and its sheets A to Z by title. Each row SHALL show the sheet's title and its artist if it has one, and SHALL open the sheet to play at `/sheets/:id`.

#### Scenario: A to Z
- **WHEN** "Christmas" holds "Stille Nacht" and "Drüü Könige"
- **THEN** its page lists "Drüü Könige", then "Stille Nacht", and says "2 sheets"

#### Scenario: Opening a sheet
- **WHEN** the owner selects the row "Stille Nacht"
- **THEN** the play view of "Stille Nacht" opens

### Requirement: Who can open a collection
A visitor who isn't signed in SHALL be sent to the sign-in page. A signed-in person who opens an id that isn't one of their collections SHALL see a "not found" page. The page SHALL ask search engines not to index it.

#### Scenario: Someone else's collection
- **WHEN** a person opens the address of a collection another person owns
- **THEN** they see the "not found" page

### Requirement: An empty collection
A collection without sheets SHALL say "No sheets yet" below its name, and show "No sheets in this collection" with "Add sheets" in place of the list.

#### Scenario: A new collection
- **WHEN** the owner opens a collection they just made
- **THEN** the page says "No sheets in this collection" and offers "Add sheets"

### Requirement: Removing a sheet
Each row SHALL have a button named for the sheet and the collection, such as "Remove Stille Nacht from Christmas". It SHALL take the sheet out of the collection at once. The sheet SHALL stay in the library.

#### Scenario: Removing
- **WHEN** the owner selects "Remove Stille Nacht from Christmas"
- **THEN** the page no longer lists "Stille Nacht", and the library still does

### Requirement: Adding sheets
"Add sheets" SHALL open a dialog that lists the owner's sheets with a tick box each, and a search field that finds them as the library's search does. Sheets already in the collection SHALL show ticked and SHALL NOT be unticked there. The add button SHALL count the sheets ticked, such as "Add 2 sheets", and SHALL be disabled while none is ticked. "Cancel" or Escape SHALL add nothing.

#### Scenario: Adding two sheets
- **WHEN** the owner opens "Add sheets" on "Christmas", searches "nacht", ticks "Heilige Nacht" and "Es wird scho glei dumpa", and selects "Add 2 sheets"
- **THEN** the dialog closes and the page lists both sheets

#### Scenario: Already in the collection
- **WHEN** the owner opens "Add sheets" on "Christmas", which holds "Stille Nacht"
- **THEN** "Stille Nacht" shows ticked and can't be unticked

### Requirement: The collection's menu
A button beside the name SHALL open the collection's menu, with "Rename" and "Delete".

#### Scenario: Opening the menu
- **WHEN** the owner selects the menu button on "Christmas"
- **THEN** the menu shows "Rename" and "Delete"

### Requirement: Renaming a collection
"Rename" SHALL open a dialog with a name field holding the name, selected. "Save" SHALL store the new name, and the heading SHALL show it. A name the owner already uses SHALL keep the dialog open, with a note that says so. "Cancel" or Escape SHALL keep the old name.

#### Scenario: Renaming
- **WHEN** the owner renames "Christmas" to "Weihnachten"
- **THEN** the heading reads "Weihnachten", and so does its row on the Collections tab

#### Scenario: Name in use
- **WHEN** the owner has "Campfire" and renames "Christmas" to "campfire"
- **THEN** the dialog stays open and says the name is already used

### Requirement: Deleting a collection
"Delete" SHALL first ask to confirm, naming the collection and saying that its sheets stay in the library and that this can't be undone. Confirming SHALL delete the collection and open the Collections tab. "Cancel" SHALL keep it.

#### Scenario: Deleting
- **WHEN** the owner deletes "Christmas" and confirms
- **THEN** the Collections tab opens without "Christmas", and its sheets are still in the library
