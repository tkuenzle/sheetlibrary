# Spec Delta

## ADDED Requirements

### Requirement: Sheets and Collections tabs
Below the library's heading, two tabs SHALL link to "Sheets" at `/sheets` and "Collections" at `/collections`, with the open one marked. Each tab SHALL have its own actions: "Import" and "New sheet" on Sheets, "New collection" on Collections. The search field SHALL show only on Sheets.

#### Scenario: Switching tabs
- **WHEN** a person on `/sheets` selects "Collections"
- **THEN** `/collections` opens with "Collections" marked and "New collection", and without the search field

#### Scenario: Reload
- **WHEN** a person reloads `/collections`
- **THEN** the Collections tab shows again

### Requirement: My collections
The Collections tab SHALL list the signed-in person's collections and no one else's, A to Z by name. Each row SHALL show the name and how many sheets the collection holds, and SHALL open the collection at `/collections/:id`. A visitor who isn't signed in SHALL be sent to the sign-in page, and the page SHALL ask search engines not to index it.

#### Scenario: A to Z
- **WHEN** a person has the collections "Kinderlieder" with 31 sheets and "Christmas" with 14
- **THEN** the tab lists "Christmas" with "14 sheets", then "Kinderlieder" with "31 sheets"

#### Scenario: Not signed in
- **WHEN** a visitor who isn't signed in opens `/collections`
- **THEN** they are sent to the sign-in page

### Requirement: No collections yet
A person without collections SHALL see "No collections yet" and "New collection" on the Collections tab instead of the list.

#### Scenario: First visit
- **WHEN** a person who has no collections opens the Collections tab
- **THEN** it says "No collections yet" and offers "New collection"

### Requirement: New collection
"New collection" SHALL open a dialog with a name field. "Save" SHALL make the collection and open its page. A name the person already uses SHALL keep the dialog open, with a note that says so. "Cancel" or Escape SHALL make nothing.

#### Scenario: Making a collection
- **WHEN** a person selects "New collection", types "Christmas" and selects "Save"
- **THEN** the empty page of "Christmas" opens

#### Scenario: Name in use
- **WHEN** a person who has "Christmas" makes a collection named "Christmas"
- **THEN** the dialog stays open and says the name is already used
