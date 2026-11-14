# Spec Delta

## MODIFIED Requirements

### Requirement: Search field
Every screen in the shell SHALL show a search field at the top, whether or not the person has sheets. A search SHALL find their sheets whose title, artist or lyrics hold every word typed, and no one else's.

#### Scenario: Finding by lyrics
- **WHEN** a person has "Amazing Grace", whose lyrics hold "how sweet the sound", and "Hallelujah", and searches "sweet sound"
- **THEN** the library lists "Amazing Grace" and not "Hallelujah"

#### Scenario: Someone else's sheets
- **WHEN** another person has a sheet "Shenandoah", and this person searches "shenandoah"
- **THEN** no sheet is found

#### Scenario: Without sheets
- **WHEN** a person who has no sheets opens `/collections`
- **THEN** the search field shows at the top

### Requirement: Search as you type
Results SHALL update after a short pause in typing, and typing SHALL keep the focus in the field. The search SHALL be in the address as `/sheets?q=…`, so a reload or a shared link shows the same results. A search typed on another screen SHALL open Sheets with the results, and going back SHALL return to that screen. On Sheets, each update SHALL replace the address, not add to the history. A search SHALL start at 2 characters; with fewer, the library SHALL list all sheets.

#### Scenario: Back leaves the library
- **WHEN** a person opens the library from a sheet, types "grace" and goes back
- **THEN** the sheet opens again, not the library with "grac"

#### Scenario: One character
- **WHEN** a person types "a"
- **THEN** the library lists all their sheets, newest edit first

#### Scenario: From Collections
- **WHEN** a person on `/collections` types "grace" in the search field
- **THEN** `/sheets?q=grace` opens with the results and the focus still in the field, and going back opens `/collections`
