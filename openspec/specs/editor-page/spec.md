# editor-page Specification

## Purpose

The public page where visitors try the chord editor on a seed song, without an account and without saving.

## Requirements

### Requirement: Editor with the seed song
The page at `/editor` SHALL show the chord editor with the seed song "Amazing Grace" loaded. Its sections SHALL be labeled "Verse 1" and "Verse 2".

#### Scenario: Opening the editor
- **WHEN** a visitor opens `/editor`
- **THEN** the page shows "Amazing Grace" with its chords, ready to edit, and its sections are labeled "Verse 1" and "Verse 2"

### Requirement: Nothing is saved
The page SHALL NOT save edits. A reload SHALL show the seed song as it was.

#### Scenario: Reload after editing
- **WHEN** a visitor changes the song, reloads the page and confirms leaving it
- **THEN** the page shows the seed song without the changes

### Requirement: Prototype notice
The page SHALL say that the editor is a prototype and that nothing is saved. When the side panel sits beside the editor, the notice SHALL be in the panel. Otherwise it SHALL be on the page, above the song.

#### Scenario: Reading the notice
- **WHEN** a visitor opens `/editor` in a window at least 1024px wide
- **THEN** a note in the side panel says it is a prototype and nothing is saved

#### Scenario: Reading the notice on a phone
- **WHEN** a visitor opens `/editor` on a phone
- **THEN** a note above the song says it is a prototype and nothing is saved, without opening the help

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

### Requirement: Song title
The page SHALL show the song's title, "Amazing Grace", as its heading, and after the site's name in the top bar. On a phone, the top bar SHALL show only the site's name. The browser tab SHALL read "Amazing Grace | Sheet Library".

#### Scenario: Opening the editor
- **WHEN** a visitor opens `/editor` in a window wider than a phone
- **THEN** the heading reads "Amazing Grace", the top bar reads "Sheet Library / Amazing Grace", and the tab reads "Amazing Grace | Sheet Library"

### Requirement: Help beside the editor
In a window at least 1024px wide, the page SHALL show a side panel beside the editor with how to edit. The panel SHALL stay in view while the page scrolls.

#### Scenario: Wide window
- **WHEN** a visitor opens `/editor` in a window 1280px wide
- **THEN** the side panel with "How to edit" is shown beside the song, and the top bar has no help button

#### Scenario: Scrolling a long sheet
- **WHEN** the visitor scrolls to the end of a sheet taller than the window
- **THEN** the side panel is still in view

### Requirement: Help behind a button
In a narrower window, the top bar SHALL have a "How to edit" button that opens the side panel as a modal sheet. Escape, its close button or a click outside it SHALL close it, and focus SHALL go back to the button. Opening the help SHALL NOT stop editing the active section.

#### Scenario: Opening the help on a phone
- **WHEN** a visitor taps "How to edit" in the top bar while editing a section
- **THEN** the help opens over the page, and the page behind it can't be used

#### Scenario: Closing the help
- **WHEN** the visitor presses Escape in the open help
- **THEN** the help closes, focus is on "How to edit", and the section is still active

### Requirement: Help for the device
The help SHALL match the main pointer. With a finger, it SHALL show how to edit by touch, then the keys. With a mouse, it SHALL show the keys, then how to edit with a mouse. The keys SHALL name both Ctrl K and ⌘ K for adding or changing a chord, and both Ctrl Shift L and ⌘ ⇧ L for editing the section's label.

#### Scenario: Help on a phone
- **WHEN** a visitor opens the help on a phone
- **THEN** it shows "With touch" and the keys, and no "With a mouse"

#### Scenario: Help with a mouse
- **WHEN** a visitor reads the help with a mouse
- **THEN** it shows the keys, including "Ctrl K" and "⌘ K", "Ctrl Shift L" and "⌘ ⇧ L", and "With a mouse", and no "With touch"

### Requirement: Warning before leaving with edits
When the song differs from the seed song, leaving the page SHALL first ask the visitor to confirm, with the browser's own prompt. This SHALL cover the top bar's link, a reload, closing the tab and going back. When the song is the seed song, leaving SHALL NOT ask.

#### Scenario: Leaving with edits
- **WHEN** a visitor changes the song and clicks "Sheet Library" in the top bar
- **THEN** the browser asks whether to leave, and staying keeps the changes

#### Scenario: Leaving without edits
- **WHEN** a visitor opens `/editor`, changes nothing and clicks "Sheet Library"
- **THEN** the home page opens without a prompt

### Requirement: Key beside the title
The page SHALL show the sheet's guessed key on a button beside the heading, at every width. The button SHALL follow the sheet: after an edit or a transpose, it shows the key guessed from the chords then. A sheet without chords SHALL have no key button.

#### Scenario: Seed song's key
- **WHEN** a visitor opens `/editor`
- **THEN** a button reading "Key G" sits beside the heading "Amazing Grace"

#### Scenario: No chords
- **WHEN** a visitor removes every chord of the seed song
- **THEN** the key button is gone, and it comes back with the first new chord

### Requirement: Transposing from the key button
The key button SHALL open a panel with the keys to move to and a step down and a step up by one semitone. The current key SHALL be marked. The panel SHALL name the sheet's original key, the one guessed from its chords when it was loaded, and say it was guessed. On a phone, the panel SHALL be a bottom sheet. Picking a key or a step SHALL move the sheet's chords right away and keep the panel open. Escape, a click outside or the key button SHALL close it.

#### Scenario: Picking a key
- **WHEN** a visitor opens the key button and picks A
- **THEN** the seed song's G, C and D read A, D and E, the button reads "Key A", and the panel is still open and says the original key is G

#### Scenario: Stepping
- **WHEN** a visitor opens the key button and steps up twice
- **THEN** the button reads "Key A"

### Requirement: Undoing a transpose
A transpose SHALL be one step to undo, like any other edit. Ctrl Z and ⌘ Z SHALL undo while the panel is open too.

#### Scenario: Undo
- **WHEN** a visitor moves the seed song to A and then presses Ctrl Z in the panel
- **THEN** the chords and the button are back in G

### Requirement: Back to the original key
The panel SHALL always show a button back to the sheet's original key, such as "Back to G", and disable it while the sheet is in that key. It SHALL move the chords to the original key, as one step to undo.

#### Scenario: Back to G after reopening
- **WHEN** a visitor steps the seed song up three times, closes the panel, opens it again and picks "Back to G"
- **THEN** the chords are as before, the button reads "Key G", and "Back to G" is disabled
