# Spec Delta

## MODIFIED Requirements

### Requirement: No sheets yet
A person without sheets SHALL see "No sheets yet", "Import" and "New sheet" instead of the list.

#### Scenario: First sign-in
- **WHEN** a person who has no sheets opens the library
- **THEN** the page says "No sheets yet" and offers "Import" and "New sheet"

## ADDED Requirements

### Requirement: Import from Ultimate Guitar
"Import" SHALL sit beside "New sheet" and open a dialog to paste text copied from Ultimate Guitar. Importing SHALL read the text as the import on `/editor` does, create a sheet titled "Untitled" with what it read, and open it at `/sheets/:id` with the title field open and "Untitled" selected. The dialog SHALL NOT say that a sheet is replaced.

#### Scenario: Importing a song
- **WHEN** a person selects "Import", pastes the chords and lyrics of "Amazing Grace" and selects "Import" in the dialog
- **THEN** a sheet opens with those chords and lyrics, the heading "Untitled" and the title field open, and the library lists "Untitled" first

#### Scenario: Cancelling
- **WHEN** a person selects "Import", pastes text and selects "Cancel"
- **THEN** the dialog closes and the library has no new sheet

### Requirement: Import too large
When the text makes a sheet larger than a sheet can be, the dialog SHALL stay open with the text, say that it is too long to import, and create no sheet.

#### Scenario: Too large
- **WHEN** a person pastes text that makes a sheet larger than a sheet can be, and selects "Import"
- **THEN** the dialog stays open and says the text is too long to import
