# Spec Delta

## MODIFIED Requirements

### Requirement: Import from Ultimate Guitar
"Import" SHALL sit beside "New sheet" and open a menu with "From photos…" and "From Ultimate Guitar…". "From Ultimate Guitar…" SHALL open a dialog to paste text copied from Ultimate Guitar. Importing SHALL read the text as the import on `/editor` does, create a sheet titled "Untitled" with what it read, and open it at `/sheets/:id` with the title field open and "Untitled" selected. With a capo under "Written for", the sheet SHALL open with that capo. The dialog SHALL NOT say that a sheet is replaced.

#### Scenario: Importing a song
- **WHEN** a person selects "Import", then "From Ultimate Guitar…", pastes the chords and lyrics of "Amazing Grace" and selects "Import" in the dialog
- **THEN** a sheet opens with those chords and lyrics, the heading "Untitled" and the title field open, and the library lists "Untitled" first

#### Scenario: Importing with a capo
- **WHEN** a person imports "Amazing Grace" in G from Ultimate Guitar, with "Capo 2" under "Written for", and later opens it from the library
- **THEN** it first opens with "Capo 2" and the chords as pasted, and from the library it opens in A without a capo

#### Scenario: Cancelling
- **WHEN** a person selects "Import", then "From Ultimate Guitar…", pastes text and selects "Cancel"
- **THEN** the dialog closes and the library has no new sheet
