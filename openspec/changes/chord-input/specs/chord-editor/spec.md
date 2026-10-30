# Spec Delta

## ADDED Requirements

### Requirement: Chord preview
While the chord input is open, a line under the field SHALL show the chord the text reads as, in its canonical form and with its mark: "Adds" and the chord for a new chord, "Changes", the old chord, "to" and the new chord when editing. While the text isn't a chord, the line SHALL be blank and no note SHALL show.

#### Scenario: Canonical form before Done
- **WHEN** the user types "bb-7" into the chord input for a new chord
- **THEN** the line under the field says "Adds Bbm7"

#### Scenario: Halfway text
- **WHEN** the user types "Cmx"
- **THEN** the line under the field is blank and no note shows

### Requirement: Chord suggestions
While the chord input's field is empty, one row of suggestions SHALL show: the chords in this sheet, the most used first, then the chords of the sheet's key that the sheet doesn't use, in the key's order. A chord SHALL show once. Without chords and without a key, no row SHALL show.

#### Scenario: Sheet chords, then the key
- **WHEN** a sheet in G major has the chords G, D, G, C and the user opens the chord input
- **THEN** the suggestions are G, D, C, Am, Bm, Em, F#dim, in that order

### Requirement: Suggestions while typing
While the field holds text, the suggestions SHALL narrow to the chords that start with the text, after reading it as the chord input does. Completions of the typed root with common suffixes SHALL follow the chords of the sheet and the key.

#### Scenario: Narrowing and completing
- **WHEN** a sheet in G major has the chords G, D and C and the user types "d"
- **THEN** D is suggested first, followed by completions such as D7, Dsus4 and Dm, and G and C are not suggested

### Requirement: Chords new to the sheet
Suggestions the sheet doesn't use yet SHALL look different from the sheet's own chords, and a legend SHALL say what the difference means. A screen reader SHALL announce the difference too.

#### Scenario: A key chord
- **WHEN** the suggestions show Am in a sheet without Am
- **THEN** Am looks different from the sheet's chords, and a screen reader reads it as not in this sheet yet

### Requirement: Picking a suggestion
A click or tap on a suggestion SHALL add it, or change the chord being edited to it, and close the input. The arrow keys SHALL choose a suggestion, and Enter SHALL then pick it. A mark typed before the text SHALL stay on the picked chord.

#### Scenario: Tap
- **WHEN** the user opens the chord input on the "r" in "wretch" and taps the suggestion "D"
- **THEN** "D" sits on the "r" and the input is closed

#### Scenario: Keeping the mark
- **WHEN** the user types "(d" and picks "D7"
- **THEN** "(D7)" appears above the letter

### Requirement: Docked chord input
On a device whose main pointer is a finger, or in a window too narrow for the margin beside the section, the chord input SHALL be docked at the bottom of the visible area, across its width, above the keyboard when it is open. The letter the chord goes on SHALL stay visible above it.

#### Scenario: Phone
- **WHEN** the user taps "+ Chord" on a phone
- **THEN** the chord input is at the bottom of the visible area, above the keyboard, and the letter is above the input
