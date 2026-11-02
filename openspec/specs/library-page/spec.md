# library-page Specification

## Purpose

The library at `/sheets`: where a signed-in person finds their sheets and starts a new one.

## Requirements

### Requirement: My sheets
The page at `/sheets` SHALL list the signed-in person's sheets and no one else's, the most recently edited first. Each row SHALL show the sheet's title, its artist if it has one, and when it was last edited. A row SHALL open the sheet at `/sheets/:id`.

#### Scenario: Newest edit first
- **WHEN** a person has the sheets "Amazing Grace" and "Hallelujah", and last edited "Hallelujah"
- **THEN** the library lists "Hallelujah" first, then "Amazing Grace"

#### Scenario: Someone else's sheets
- **WHEN** another person has a sheet "Shenandoah"
- **THEN** it doesn't appear in this person's library

### Requirement: When a sheet was last edited
A row SHALL say "Today" or "Yesterday" for a sheet last edited on those days, in the viewer's time zone. Otherwise it SHALL show the day and month, such as "28 Oct", and the year too when it isn't the current year.

#### Scenario: Edited earlier this year
- **WHEN** it is 2 November 2026 and a sheet was last edited on 28 October 2026
- **THEN** its row says "28 Oct"

### Requirement: New sheet
"New sheet" SHALL create a sheet titled "Untitled" with no lyrics, and open it at `/sheets/:id` with the title field open and "Untitled" selected. A reload of that sheet SHALL NOT open the field again.

#### Scenario: Starting a sheet
- **WHEN** a person selects "New sheet"
- **THEN** the sheet page opens with the heading "Untitled", and the library lists "Untitled" first

#### Scenario: Naming a new sheet
- **WHEN** a person selects "New sheet", types "Amazing Grace" and presses Enter
- **THEN** the heading reads "Amazing Grace"

### Requirement: No sheets yet
A person without sheets SHALL see "No sheets yet" and "New sheet" instead of the list.

#### Scenario: First sign-in
- **WHEN** a person who has no sheets opens the library
- **THEN** the page says "No sheets yet" and offers "New sheet"

### Requirement: Who can open the library
A visitor who isn't signed in SHALL be sent to the sign-in page. The page SHALL ask search engines not to index it.

#### Scenario: Not signed in
- **WHEN** a visitor who isn't signed in opens `/sheets`
- **THEN** they are sent to the sign-in page
