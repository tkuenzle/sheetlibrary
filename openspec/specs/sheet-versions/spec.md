# sheet-versions Specification

## Purpose

Keeps versions of a sheet: a name and a key, for who or what the sheet is played for, such as "Anna's key" in A, stored apart from the sheet.

## Requirements

### Requirement: A version is a name and a key
A version SHALL belong to one sheet and hold a name and a key, and nothing else. A sheet MAY have several versions, also in the same key or with the same name. A name SHALL be trimmed and SHALL be 1 to 40 characters. A version SHALL NOT hold chords, so it SHALL show the sheet as it is now.

#### Scenario: Edit after saving a version
- **WHEN** the owner saves the version "Anna's key" in A of a sheet in G, then changes a chord in the sheet
- **THEN** the version shows the changed chord, moved to A

#### Scenario: Empty name
- **WHEN** a version is saved with a name that is empty once trimmed
- **THEN** it is refused

### Requirement: Versions belong to the sheet's owner
Only the owner of a sheet SHALL be able to save, read, change and delete its versions. For anyone else, a version SHALL be answered exactly as one that doesn't exist. A request from someone who isn't signed in SHALL be refused.

#### Scenario: Someone else's version
- **WHEN** a person asks for a version of a sheet that another person owns
- **THEN** the answer is "not found", the same as for an unknown version

### Requirement: Stored apart from the sheet
Saving, changing or deleting a version SHALL NOT change the sheet or its revision. Deleting a sheet SHALL delete its versions.

#### Scenario: Saving while the editor is open
- **WHEN** the sheet is open in the editor in one tab, and a version is saved in another, then the editor saves an edit
- **THEN** the edit is saved, and the editor doesn't say the sheet changed in another tab

#### Scenario: Deleting the sheet
- **WHEN** a sheet with two versions is deleted
- **THEN** its versions are gone too

### Requirement: Major or minor follows the song key
A version in major on a sheet whose song key is minor, or the other way round, SHALL show the sheet in its relative key, three semitones lower or higher. A version SHALL keep its own key otherwise.

#### Scenario: Song key set to minor
- **WHEN** a sheet guessed as G major has the version "Anna's key" in A, and the owner sets the song key to Em
- **THEN** the version shows the sheet in F#m

### Requirement: Moving the chords keeps the versions' keys
Moving the sheet's chords to another key, as "Make A the song key" does, SHALL leave each version in its key.

#### Scenario: Making a version's key the song key
- **WHEN** a sheet in G has the version "Sunday band" in Bb, and the owner makes A the song key
- **THEN** the chords are stored in A, and "Sunday band" still shows the sheet in Bb
