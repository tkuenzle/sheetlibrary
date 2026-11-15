# Spec Delta

## ADDED Requirements

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

## REMOVED Requirements

### Requirement: When a sheet was last edited
**Reason**: The list's third column shows the key instead, as the `sheet-list` capability says, so no row shows the edit date.
**Migration**: None. "Last edited" stays as an order.
