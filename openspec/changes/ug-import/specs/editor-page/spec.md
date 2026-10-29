# Spec Delta

## ADDED Requirements

### Requirement: Import from Ultimate Guitar
The top bar SHALL have an "Import from Ultimate Guitar" button at every width. It SHALL open a modal dialog with a field to paste text copied from an Ultimate Guitar page, and say that importing replaces the sheet on this page. Cancel, Escape or a click outside SHALL close it without a change, and focus SHALL go back to the button.

#### Scenario: Cancelling
- **WHEN** a visitor opens the import, pastes text and presses Escape
- **THEN** the dialog closes, the seed song is unchanged, and focus is on the import button

### Requirement: Imported sheet replaces the song
Importing SHALL replace the sheet on the page with the one read from the pasted text, and close the dialog. The key button SHALL follow the new sheet, and its original key SHALL be the one guessed from the imported chords. The heading SHALL stay as it is.

#### Scenario: Importing a verse
- **WHEN** a visitor pastes `[Verse 1]`, `C     G` and `Hello world` and imports
- **THEN** the sheet has one section "Verse 1" with "Hello world", C on "H" and G on "w", and the key button reads "Key C"

## MODIFIED Requirements

### Requirement: Warning before leaving with edits
When the song differs from the seed song, leaving the page SHALL first ask the visitor to confirm, with the browser's own prompt. This SHALL cover the top bar's link, a reload, closing the tab and going back. When the song is the seed song, leaving SHALL NOT ask. An imported sheet SHALL count as differing, even before it is edited.

#### Scenario: Leaving with edits
- **WHEN** a visitor changes the song and clicks "Sheet Library" in the top bar
- **THEN** the browser asks whether to leave, and staying keeps the changes

#### Scenario: Leaving without edits
- **WHEN** a visitor opens `/editor`, changes nothing and clicks "Sheet Library"
- **THEN** the home page opens without a prompt

#### Scenario: Leaving after an import
- **WHEN** a visitor imports a sheet and clicks "Sheet Library"
- **THEN** the browser asks whether to leave
