# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: Back to the original key`
- TO: `### Requirement: Back to the song key`

## MODIFIED Requirements

### Requirement: Key beside the title
The page SHALL show the key the sheet is shown in on a button beside the heading, at every width. Without a transpose, that is the sheet's key: the set key, or, without one, the key guessed from the chords. The button SHALL follow the sheet: after an edit or a transpose, it shows the key then. While the sheet is shown in another key, the button SHALL be filled with the accent colour and SHALL add how many semitones up or down it is from the song key, the shorter way, such as "Key A · +2". A sheet without chords and without a set key SHALL have no key button.

#### Scenario: Seed song's key
- **WHEN** a visitor opens `/editor`
- **THEN** a button reading "Key G" sits beside the heading "Amazing Grace"

#### Scenario: Transposed
- **WHEN** a visitor moves the seed song to A, and then to F#
- **THEN** the button is filled and reads "Key A · +2", then "Key F# · −1"

#### Scenario: No chords
- **WHEN** a visitor removes every chord of the seed song
- **THEN** the key button is gone, and it comes back with the first new chord

### Requirement: Transposing from the key button
The key button SHALL open a panel in two parts. "Song key" SHALL show the sheet's key, and say it is guessed from the chords while no key is set. "Transpose to" SHALL hold the keys to move to, with the shown key marked, and a step down and a step up by one semitone. On a phone, the panel SHALL be a bottom sheet. Picking a key or a step SHALL show the chords in that key right away, without changing the sheet, and keep the panel open. Escape, a click outside or the key button SHALL close it.

#### Scenario: Picking a key
- **WHEN** a visitor opens the key button and picks A
- **THEN** the seed song's G, C and D read A, D and E, the button reads "Key A", and the panel is still open, with the song key G, guessed from the chords, and "Back to G"

#### Scenario: Stepping
- **WHEN** a visitor opens the key button and steps up twice
- **THEN** the button reads "Key A"

### Requirement: Back to the song key
The panel SHALL always show a button back to the sheet's song key, such as "Back to G", and disable it while the sheet is shown in that key. It SHALL show the chords in the song key again, without changing the sheet.

#### Scenario: Back to G after reopening
- **WHEN** a visitor steps the seed song up three times, closes the panel, opens it again and picks "Back to G"
- **THEN** the chords are as before, the button reads "Key G", and "Back to G" is disabled

### Requirement: Setting the song's key
Beside the song key, the panel SHALL offer "Change". It SHALL say that the chords stay as they are, name the key guessed from the chords when the sheet has chords, and list the major and the minor keys, with the sheet's key marked. Picking one SHALL set it as the sheet's key without moving any chord. While the sheet is shown in another key, the shown key SHALL keep its distance from the song key, so no chord reads differently. Cancel SHALL keep the key as it was.

#### Scenario: Seed song in E minor
- **WHEN** a visitor opens the key button, selects "Change" and picks Em
- **THEN** the chords are unchanged, the button reads "Key Em", the song key is Em and not said to be guessed, and "Back to Em" is disabled

#### Scenario: Guess shown after setting
- **WHEN** a visitor sets the seed song's key to Em and selects "Change" again
- **THEN** it says the key guessed from the chords is G, and Em is marked

#### Scenario: Edits after setting
- **WHEN** a visitor sets the seed song's key to Em and then removes every chord
- **THEN** the button still reads "Key Em"

#### Scenario: Setting the key while transposed
- **WHEN** a visitor moves the seed song to A, then selects "Change" and picks Em
- **THEN** the chords still read A, D and E, the button reads "Key F#m", and the song key is Em

## ADDED Requirements

### Requirement: Undo in the key panel
A transpose SHALL NOT be a step to undo. Setting the song key, and making the shown key the song key, SHALL each be one step to undo. Ctrl Z and ⌘ Z SHALL undo while the panel is open too.

#### Scenario: Undo after a transpose
- **WHEN** a visitor types a word, moves the seed song to A and then presses Ctrl Z in the panel
- **THEN** the word is gone, and the chords still read in A

#### Scenario: Undo setting the song key
- **WHEN** a visitor sets the seed song's key to Em and then presses Ctrl Z in the panel
- **THEN** the button reads "Key G"

### Requirement: Shown key in the address
The page's address SHALL hold the shown key as `key`, spelled as the panel spells it and encoded, such as `?key=F%23m`. Opening the address SHALL show the sheet in that key. A transpose SHALL replace the address, not add to the browser's history. In the song key, the address SHALL have no `key`. A `key` that isn't a key to move to for the song SHALL be removed, and the sheet shown in its song key.

#### Scenario: Reload in A
- **WHEN** a visitor moves the seed song to A and reloads
- **THEN** the chords read A, D and E, and the button reads "Key A"

#### Scenario: Leaving after steps
- **WHEN** a visitor opens `/editor` from the home page, steps up three times and goes back in the browser
- **THEN** the home page shows

#### Scenario: Key that doesn't fit
- **WHEN** a visitor opens `/editor?key=Am`
- **THEN** the button reads "Key G", and the address has no `key`

### Requirement: Chords edited while transposed
While the sheet is shown in another key, the chord input SHALL show, take and suggest chords in the shown key. A chord added or changed SHALL be stored moved back to the song key.

#### Scenario: Adding a chord in A
- **WHEN** a visitor moves the seed song to A, adds the chord E and picks "Back to G"
- **THEN** the new chord reads D

### Requirement: Making the shown key the song key
Next to "Back", while the sheet is shown in another key, the panel SHALL offer to make it the song key, such as "Make A the song key". It SHALL move the chords to that key as one step to undo, with a set key moving too, and then show the sheet in its song key.

#### Scenario: Making A the song key
- **WHEN** a visitor moves the seed song to A and picks "Make A the song key"
- **THEN** the chords read A, D and E, the button reads "Key A", the song key is A, guessed from the chords, "Back to A" is disabled, and the address has no `key`

## REMOVED Requirements

### Requirement: Undoing a transpose
**Reason**: A transpose no longer changes the sheet, so there is nothing to undo.
**Migration**: "Undo in the key panel" covers undo while the panel is open. "Back to the song key" returns from a transpose.
