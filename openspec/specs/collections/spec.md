# collections Specification

## Purpose

Groups a person's sheets in named collections, such as "Christmas", stored apart from the sheets. A collection is the thing that sharing will later work on.

## Requirements

### Requirement: A collection is a name and its sheets
A collection SHALL have a name and hold sheets, without an order. A sheet MAY be in any number of collections, and SHALL be in one collection at most once. A name SHALL be trimmed and SHALL be 1 to 40 characters.

#### Scenario: One sheet, two collections
- **WHEN** a person adds "Stille Nacht" to "Christmas" and to "Kinderlieder"
- **THEN** both collections hold "Stille Nacht"

#### Scenario: Empty name
- **WHEN** a collection is made with a name that is empty once trimmed
- **THEN** it is refused

### Requirement: Names are unique per person
A person's collections SHALL have different names, without regard to case. Making or renaming a collection to a name the person already uses SHALL be refused. Other people MAY use the same name.

#### Scenario: Same name in another case
- **WHEN** a person has "Christmas" and makes a collection named "christmas"
- **THEN** it is refused, and the person still has one "Christmas"

### Requirement: Collections belong to their owner
A collection SHALL belong to the person who made it. Only they SHALL be able to read, rename and delete it, and add or remove its sheets. For anyone else, a collection SHALL be answered exactly as one that doesn't exist. A request from someone who isn't signed in SHALL be refused.

#### Scenario: Someone else's collection
- **WHEN** a person asks for a collection that another person owns
- **THEN** the answer is "not found", the same as for an unknown collection

### Requirement: Only one's own sheets
A collection SHALL hold only sheets of its owner. Adding a sheet that isn't one of the owner's SHALL be refused, as for a sheet that doesn't exist.

#### Scenario: Adding someone else's sheet
- **WHEN** a person adds a sheet that another person owns to their collection
- **THEN** it is refused as "not found", and the collection stays as it was

### Requirement: Stored apart from the sheets
Adding a sheet to a collection, or removing it, SHALL NOT change the sheet or its revision. Deleting a collection SHALL keep its sheets. Deleting a sheet SHALL take it out of every collection.

#### Scenario: Adding while the editor is open
- **WHEN** a sheet is open in the editor in one tab, and is added to a collection in another, then the editor saves an edit
- **THEN** the edit is saved, and the editor doesn't say the sheet changed in another tab

#### Scenario: Deleting a collection
- **WHEN** a person deletes "Christmas", which holds "Stille Nacht"
- **THEN** "Stille Nacht" is still in the library

#### Scenario: Deleting a sheet
- **WHEN** a person deletes "Stille Nacht", which is in "Christmas"
- **THEN** "Christmas" no longer holds it, and holds one sheet fewer
