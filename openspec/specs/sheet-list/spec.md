# sheet-list Specification

## Purpose

The list of sheets that Sheets and a collection show, and later a set: its rows, its order and the menu on each row, the same wherever the list appears.

## Requirements

### Requirement: A row in the list
Each row SHALL show the sheet's title, its artist if it has one, and when it was last edited, as the `library-page` capability says. A row SHALL open the sheet to play at `/sheets/:id`. Sheets and a collection SHALL show the same rows.

#### Scenario: The same row in a collection
- **WHEN** "Stille Nacht" by Franz Xaver Gruber, last edited today, is in "Christmas"
- **THEN** its row on `/sheets` and on the page of "Christmas" both show "Stille Nacht", "Franz Xaver Gruber" and "Today"

### Requirement: Order of the sheets
The list SHALL sort sheets A to Z by title unless the person chooses another order. A control above the list SHALL name the current order and offer "Title", "Artist", "Last edited" and "Last added". Title and artist SHALL sort A to Z. By artist, sheets without an artist SHALL come last. "Last edited" and "Last added" SHALL put the newest first.

#### Scenario: A to Z by default
- **WHEN** a person has "Stille Nacht" and "Amazing Grace", and last edited "Stille Nacht"
- **THEN** the list shows "Amazing Grace", then "Stille Nacht"

#### Scenario: By artist
- **WHEN** a person chooses "Artist" and has "Danny Boy" by Frederic Weatherly, "Amazing Grace" by John Newton and "Sternsinger" without an artist
- **THEN** the list shows "Danny Boy", "Amazing Grace", then "Sternsinger"

### Requirement: The order is kept
The chosen order SHALL be kept on the device. It SHALL apply on Sheets and in every collection, and SHALL still apply after a reload or a later visit. The page SHALL show the sheets in that order from the first load.

#### Scenario: From Sheets to a collection
- **WHEN** a person chooses "Last added" on Sheets and opens "Christmas"
- **THEN** "Christmas" lists its sheets newest added first, and its order control says "Last added"

### Requirement: Order while searching
While searching, the results SHALL keep their best match first, as the `library-search` capability says, and the order control SHALL be hidden.

#### Scenario: Searching
- **WHEN** a person who chose "Last edited" searches "grace"
- **THEN** the results show best match first, and no order control is shown

### Requirement: The menu on a row
Each row SHALL have a menu button named for the sheet, such as "More for Stille Nacht". Its menu SHALL hold "Choose collections…" and "Delete". In a collection, "Remove from" and the collection's name, such as "Remove from Christmas", SHALL sit before "Delete". The menu SHALL NOT hold Edit, Rename or Print; those stay on the sheet.

#### Scenario: On Sheets
- **WHEN** a person opens the menu of "Stille Nacht" on `/sheets`
- **THEN** it shows "Choose collections…" and "Delete"

#### Scenario: In a collection
- **WHEN** a person opens the menu of "Stille Nacht" on the page of "Christmas"
- **THEN** it shows "Choose collections…", "Remove from Christmas" and "Delete"

### Requirement: Choose collections from a row
"Choose collections…" on a row SHALL open the same dialog as on the play view, for that sheet. The rail SHALL show the new counts once the dialog closes.

#### Scenario: Adding from Sheets
- **WHEN** a person picks "Choose collections…" on the row "Stille Nacht", ticks "Christmas" and selects "Done"
- **THEN** the page of "Christmas" lists "Stille Nacht", and the rail counts one more sheet in "Christmas"

### Requirement: Deleting from a row
"Delete" on a row SHALL first ask to confirm, as on the sheet page. Confirming SHALL take the row away at once and delete the sheet. The rail SHALL show the new counts of the collections it was in. "Cancel" SHALL keep the sheet.

#### Scenario: Deleting
- **WHEN** a person picks "Delete" on the row "Stille Nacht", which is in "Christmas", and confirms
- **THEN** the list no longer shows "Stille Nacht", and the rail counts one sheet fewer in "Christmas"

#### Scenario: Cancelling
- **WHEN** a person picks "Delete" on a row and then "Cancel"
- **THEN** the row stays

### Requirement: A change on a row that doesn't get through
When deleting or removing from a row can't reach the server, or the server refuses, the row SHALL come back and a note SHALL say that the change didn't get through. The list SHALL stay on screen.

#### Scenario: Deleting offline
- **WHEN** a person confirms "Delete" on the row "Stille Nacht" while the network is down
- **THEN** the row comes back, a note says "Stille Nacht" couldn't be deleted, and the list stays on screen
