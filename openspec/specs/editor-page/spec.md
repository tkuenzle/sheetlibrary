# editor-page Specification

## Purpose

The public page where visitors try the chord editor on a seed song, without an account and without saving.

## Requirements

### Requirement: Editor with the seed song
The page at `/editor` SHALL show the chord editor with the seed song "Amazing Grace" loaded.

#### Scenario: Opening the editor
- **WHEN** a visitor opens `/editor`
- **THEN** the page shows "Amazing Grace" with its chords, ready to edit

### Requirement: Nothing is saved
The page SHALL NOT save edits. A reload SHALL show the seed song as it was.

#### Scenario: Reload after editing
- **WHEN** a visitor changes the song and reloads the page
- **THEN** the page shows the seed song without the changes

### Requirement: Prototype notice
The page SHALL say that the editor is a prototype and that nothing is saved.

#### Scenario: Reading the notice
- **WHEN** a visitor opens `/editor`
- **THEN** a note above the song says it is a prototype and nothing is saved

### Requirement: Hidden from search engines
The page SHALL ask search engines not to index it.

#### Scenario: Robots meta tag
- **WHEN** a search engine loads `/editor`
- **THEN** the page has a `robots` meta tag with `noindex`

### Requirement: Linked from the home page
The home page SHALL link to `/editor`.

#### Scenario: Following the link
- **WHEN** a visitor clicks the editor link on the home page
- **THEN** `/editor` opens
