# Spec Delta

## ADDED Requirements

### Requirement: Opening a version
The page at `/sheets/:id?version=…` SHALL show the sheet in the version's key, complete before JavaScript. With `key` next to `version`, it SHALL show the sheet in that key, with the version still open.

#### Scenario: Link to a version
- **WHEN** the owner opens the address of "Anna's key", a version in A of a sheet in G, with JavaScript turned off
- **THEN** the chords are in A, and the key button reads "Key A"

#### Scenario: Version in another key
- **WHEN** the owner opens "Anna's key" with `key=Bb` next to `version`
- **THEN** the chords are in Bb, and the page still shows "Anna's key"

### Requirement: The version's name on the page
While a version is open, its name SHALL show after the artist, such as "John Newton · Anna's key", or alone for a sheet without an artist. It SHALL also show with lyrics only.

#### Scenario: Name after the artist
- **WHEN** the owner opens "Anna's key" of "Amazing Grace" by John Newton
- **THEN** "John Newton · Anna's key" shows below the title

### Requirement: A version that is gone
An address with a version that doesn't exist SHALL show the sheet in its song key, without a version, and the address SHALL drop `version`.

#### Scenario: Bookmark after deleting
- **WHEN** the owner opens a bookmark of "Anna's key" after deleting that version
- **THEN** the sheet shows in its song key, and no version's name shows

### Requirement: Saving the first version
On a sheet without versions, the key panel SHALL be as before, with a "…" beside the song key. It SHALL hold "Save A as a version…", named for the key the sheet is shown in.

#### Scenario: No versions yet
- **WHEN** the owner shows a sheet in G without versions in A and opens the "…" beside the song key in the key panel
- **THEN** it holds "Save A as a version…", and the panel lists no versions

### Requirement: Versions in the key panel
On a sheet with versions, the key panel SHALL list them in place of the song key: "Song key" with its key first, then each version with its name and key, in the order they were saved, then "Save A as a version…". The open version, or "Song key" when none is open, SHALL be marked. After about four versions, the list SHALL scroll, and "Save … as a version…" SHALL stay below it.

#### Scenario: Two versions
- **WHEN** the owner opens the key panel of a sheet in G with "Anna's key" in A and "Sunday band" in Bb, shown in A without a version
- **THEN** the panel lists "Song key G", "Anna's key A" and "Sunday band Bb", marks "Song key", and ends with "Save A as a version…"

### Requirement: Picking a version
Picking a version in the list SHALL open it, and picking "Song key" SHALL show the sheet in its song key without a version. The chords SHALL change without loading the page again, and the address SHALL follow.

#### Scenario: Switching versions
- **WHEN** the owner has "Anna's key" open and picks "Sunday band" in the list
- **THEN** the chords are in Bb without a page load, "Sunday band" shows after the artist, and the address holds its version

### Requirement: Naming a version
"Save A as a version…" SHALL open a dialog with a name field, filled in with "Key A" and selected. "Save" SHALL store the version with that name and the shown key, and open it. "Cancel" or Escape SHALL store nothing.

#### Scenario: Saving with a name
- **WHEN** the owner shows a sheet in A, picks "Save A as a version…", types "Anna's key" and presses Enter
- **THEN** "Anna's key" shows after the artist, and the list holds "Anna's key A"

#### Scenario: Keeping the suggested name
- **WHEN** the owner picks "Save A as a version…" and presses Enter at once
- **THEN** a version named "Key A" is saved

### Requirement: Another key in a version
Picking another key, or a step, while a version is open SHALL keep the version open and add `key` to the address. "Back to" SHALL name the version's key and return to it.

#### Scenario: Trying another key
- **WHEN** the owner has "Anna's key" in A open and picks Bb
- **THEN** the chords are in Bb, "Anna's key" still shows, and the panel offers "Back to A"

### Requirement: The open version's menu
The open version's row SHALL have a "…" that opens its menu. The menu SHALL hold "Make Bb Anna's key" while the sheet is shown in a key other than the version's, then "Rename…" and "Delete…". Only the open version's row SHALL have the "…".

#### Scenario: In the version's key
- **WHEN** the owner opens the menu of "Anna's key" while the sheet is shown in A, the version's key
- **THEN** it holds only "Rename…" and "Delete…"

### Requirement: Changing a version's key
"Make Bb Anna's key" SHALL store the shown key as the version's key. The address SHALL then drop `key`, and the list SHALL show the new key.

#### Scenario: Anna sings higher
- **WHEN** the owner shows "Anna's key" in Bb and picks "Make Bb Anna's key", then reloads the version's address
- **THEN** the sheet shows in Bb, and the list holds "Anna's key Bb"

### Requirement: Renaming a version
"Rename…" SHALL open the naming dialog with the version's name in it. "Save" SHALL store the new name, and the page and the list SHALL show it.

#### Scenario: Renaming
- **WHEN** the owner picks "Rename…" on "Sunday band", types "Evening band" and picks "Save"
- **THEN** "Evening band" shows after the artist and in the list

### Requirement: Deleting a version
"Delete…" SHALL first ask to confirm, naming the version and saying the sheet stays as it is and that this can't be undone. Confirming SHALL delete the version and show the sheet in the key it was shown in, without a version. "Cancel" SHALL keep it.

#### Scenario: Deleting
- **WHEN** the owner shows "Anna's key" in A, picks "Delete…" in its menu and confirms
- **THEN** the chords stay in A, no version's name shows, and the list no longer holds "Anna's key"

## MODIFIED Requirements

### Requirement: Printing
"Print" SHALL open the browser's print, which can also save a PDF. The printed page SHALL show the title, the artist, the open version's name and the sheet in the key and with the capo shown. It SHALL NOT show the top bar or the page's buttons.

#### Scenario: Printing in another key
- **WHEN** the owner shows a sheet in G in A and picks "Print"
- **THEN** the print preview shows the title, the artist and the chords in A, and no buttons

#### Scenario: Printing a version
- **WHEN** the owner opens "Anna's key" and picks "Print"
- **THEN** the print preview shows "Anna's key" after the artist
