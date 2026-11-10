# Spec Delta

## MODIFIED Requirements

### Requirement: Stored sheet in the editor
The page at `/sheets/:id/edit` SHALL show the owner's sheet in the chord editor, with its title as the heading and in the browser tab, its artist below the title, the key button, the capo button and the help, as on `/editor`. It SHALL NOT show the prototype notice or the Ultimate Guitar import.

#### Scenario: Opening a sheet
- **WHEN** the owner opens `/sheets/:id/edit` for their sheet "Amazing Grace" by Chris Tomlin
- **THEN** the editor shows that sheet, the heading reads "Amazing Grace" with "Chris Tomlin" below it, and the tab reads "Amazing Grace | Sheet Library"

### Requirement: Who can open the page
A visitor who isn't signed in SHALL be sent to the sign-in page. A signed-in person who opens an id that isn't one of their sheets SHALL see a "not found" page. The page SHALL ask search engines not to index it.

#### Scenario: Not signed in
- **WHEN** a visitor who isn't signed in opens `/sheets/:id/edit`
- **THEN** they are sent to the sign-in page

#### Scenario: Someone else's sheet
- **WHEN** a person opens `/sheets/:id/edit` for a sheet another person owns
- **THEN** they see a "not found" page
