# Spec Delta

## ADDED Requirements

### Requirement: Capo beside the key button
A capo button SHALL sit beside the key button. Without a capo, it SHALL read "Capo" as a quiet text button. With a capo, it SHALL read the fret, such as "Capo 3". The key button SHALL still show the key that sounds.

#### Scenario: No capo
- **WHEN** a visitor opens `/editor`
- **THEN** a button reading "Capo" sits beside "Key G"

### Requirement: Picking a capo
The capo button SHALL open a list from "No capo" to "Capo 9", each with the shapes for that fret, such as "Capo 5 · D shapes", and the capo in use marked. On a phone, the list SHALL be a bottom sheet. Picking a fret SHALL show the chords as the shapes for it right away, without changing the sheet. Escape, a click outside or the capo button SHALL close it.

#### Scenario: Capo 5
- **WHEN** a visitor opens the capo button and picks "Capo 5 · D shapes"
- **THEN** the seed song's G, C and D read D, G and A, the capo button reads "Capo 5", and the key button still reads "Key G"

#### Scenario: Capo after a transpose
- **WHEN** a visitor moves the seed song to Bb, then picks "Capo 3 · G shapes"
- **THEN** the chords read G, C and D, and the key button reads "Key Bb · +3"

### Requirement: Transposing with a capo
With a capo, picking a key, a step or "Back" SHALL keep the shapes and move the capo, when the new capo is a fret from 1 to 9. Where the shapes are the new key, there SHALL be no capo. Where it would need fret 10 or 11, the capo SHALL stay and the shapes change. Without a capo, a transpose SHALL NOT add one.

#### Scenario: Singer needs C
- **WHEN** a visitor moves the seed song to Bb, picks "Capo 3 · G shapes", and then moves it to C
- **THEN** the chords still read G, C and D, and the capo button reads "Capo 5"

#### Scenario: Shapes too far
- **WHEN** a visitor picks "Capo 3 · E shapes" on the seed song, and then moves it to D
- **THEN** the capo button still reads "Capo 3", and the chords read B, E and F#

### Requirement: Capo in the address
The page's address SHALL hold the capo as `capo`, such as `?capo=3`, next to `key`. Opening the address SHALL show the sheet with that capo. Picking a fret SHALL replace the address, not add to the browser's history. Without a capo, the address SHALL have no `capo`. A `capo` that isn't a fret from 1 to 9 SHALL be removed.

#### Scenario: Reload with capo 5
- **WHEN** a visitor picks capo 5 and reloads
- **THEN** the chords read D, G and A, and the capo button reads "Capo 5"

#### Scenario: Capo that doesn't fit
- **WHEN** a visitor opens `/editor?capo=12`
- **THEN** the capo button reads "Capo", and the address has no `capo`

### Requirement: Chords edited with a capo
With a capo, the chord input SHALL show, take and suggest chords as the shapes. A chord added or changed SHALL be stored moved back to the song key.

#### Scenario: Adding a chord with capo 5
- **WHEN** a visitor picks capo 5, adds the chord A and picks "No capo"
- **THEN** the new chord reads D

### Requirement: Written for in the import
Below the pasted text, the import SHALL offer "Written for", from "No capo" to "Capo 9", for the capo the chords are written for. It SHALL show the capo the pasted text gives, and the person SHALL be able to change it.

#### Scenario: Capo in the text
- **WHEN** a visitor opens the import and pastes text with the line `Capo: 2nd fret`
- **THEN** "Written for" shows "Capo 2"

## MODIFIED Requirements

### Requirement: Key beside the title
The page SHALL show the key the sheet is shown in on a button beside the heading, at every width, with the capo button after it. Where the two buttons don't fit beside the heading, as on a phone, they SHALL wrap together below it. Without a transpose, that is the sheet's key: the set key, or, without one, the key guessed from the chords. The button SHALL follow the sheet: after an edit or a transpose, it shows the key then. A sheet without chords and without a set key SHALL have no key button.

#### Scenario: Seed song's key
- **WHEN** a visitor opens `/editor`
- **THEN** a button reading "Key G" sits beside the heading "Amazing Grace"

#### Scenario: Key on a phone
- **WHEN** a visitor opens `/editor` on a phone
- **THEN** "Key G" and "Capo" sit together below the heading

#### Scenario: No chords
- **WHEN** a visitor removes every chord of the seed song
- **THEN** the key button is gone, and it comes back with the first new chord

### Requirement: Imported sheet replaces the song
Importing SHALL replace the sheet on the page with the one read from the pasted text, and close the dialog. With a capo under "Written for", the chords SHALL be moved up to what sounds, and the sheet shown with that capo. The key button SHALL follow the new sheet, and its original key SHALL be the one guessed from the imported chords. The heading SHALL stay as it is.

#### Scenario: Importing a verse
- **WHEN** a visitor pastes `[Verse 1]`, `C     G` and `Hello world` and imports
- **THEN** the sheet has one section "Verse 1" with "Hello world", C on "H" and G on "w", and the key button reads "Key C"

#### Scenario: Importing with capo 2
- **WHEN** a visitor pastes `[Verse 1]`, `C     G` and `Hello world`, picks "Capo 2" under "Written for" and imports
- **THEN** the chords read C and G, the capo button reads "Capo 2", and the key button reads "Key D"
