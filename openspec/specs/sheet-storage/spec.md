# sheet-storage Specification

## Purpose

Stores each person's sheets online, keeps them private to their owner, and refuses saves based on an old revision so no edit is overwritten silently.

## Requirements

### Requirement: Sheets belong to their owner
A signed-in person SHALL be able to create a sheet, read it, save it and delete it. A new sheet SHALL belong to the person who created it. A request from someone who isn't signed in SHALL be refused.

#### Scenario: Create and read back
- **WHEN** a signed-in person creates the sheet "Amazing Grace" and then reads it
- **THEN** they get the sheet with its title and content, at its first revision

#### Scenario: Not signed in
- **WHEN** a visitor who isn't signed in asks for a sheet
- **THEN** the request is refused and no sheet is returned

### Requirement: Other people's sheets are not found
Reading, saving or deleting a sheet that belongs to someone else SHALL answer exactly as for a sheet that doesn't exist. It SHALL NOT show or change the sheet.

#### Scenario: Someone else's sheet
- **WHEN** a person asks for a sheet that another person owns
- **THEN** the answer is "not found", the same as for an unknown id

### Requirement: Saves name their revision
A save SHALL name the revision it was based on. If that is the sheet's current revision, the save SHALL replace the sheet and raise its revision by one. Otherwise the save SHALL be refused and the sheet SHALL stay as it was.

#### Scenario: Save on the current revision
- **WHEN** a sheet is at revision 3 and a save based on revision 3 arrives
- **THEN** the sheet is replaced and is at revision 4

#### Scenario: Two tabs
- **WHEN** two tabs both loaded revision 3, and the first saves
- **THEN** the second tab's save, based on revision 3, is refused and the first tab's edits are kept

### Requirement: Only valid sheets are stored
A create or a save SHALL be refused if the sheet breaks the envelope's or its format's rules, or if it is larger than a fixed limit of 256 KB.

#### Scenario: Invalid sheet
- **WHEN** a save holds a sheet without a title
- **THEN** it is refused and the stored sheet stays as it was
