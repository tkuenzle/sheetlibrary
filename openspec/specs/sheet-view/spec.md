# sheet-view Specification

## Purpose

A read-only view of a sheet, with chords above the lyrics and section labels, for reading and printing. It looks complete as soon as the page loads.

## Requirements

### Requirement: Read-only sheet without JavaScript
The view SHALL show a sheet's sections, their labels, and each line's lyrics with its chords above, from the page's HTML and CSS alone. It SHALL NOT need JavaScript, and SHALL NOT be editable.

#### Scenario: JavaScript off
- **WHEN** a page with the view of "Amazing Grace" loads with JavaScript turned off
- **THEN** the label "Verse 1", the lyrics and the chords above them all show, and nothing moves once the page is done

### Requirement: Space only where chords need it
A chord's name SHALL sit above its letter and MAY reach over the lyrics after it. The lyrics SHALL get extra space only where a chord's name would otherwise run into the next chord's name. Chord names SHALL NOT overlap.

#### Scenario: Room to the next chord
- **WHEN** a line reads "[G]Amazing [G7]grace"
- **THEN** the lyrics read "Amazing grace" without extra space

#### Scenario: Chords close together
- **WHEN** a line reads "[Am7]I [G]love you"
- **THEN** "love" starts past the end of "Am7", and the two names don't touch

### Requirement: Dashes in split words
Where the lyrics get space inside a word, the space SHALL show a dash and SHALL be at least 0.6em wide. Inside a word there SHALL be either no space or a dash.

#### Scenario: Tight chords inside a word
- **WHEN** a line reads "Hal[F]le[Am]lu[F]jah", and "Am" would come close to touching "F"
- **THEN** the space before "lu" shows a dash and is at least 0.6em wide

#### Scenario: Printed
- **WHEN** a sheet with a dash is printed, with the browser's "print backgrounds" turned off
- **THEN** the dash is on the paper

### Requirement: Piles and chords on a space
Several chords on one letter SHALL stand side by side, and the next letter SHALL start past the last of them. A chord on a space SHALL make the space at least as wide as the chord's name.

#### Scenario: Two chords on one letter
- **WHEN** a line reads "A[Am7][G]men"
- **THEN** "Am7" and "G" stand side by side over "m", and "en" starts past "G", after a dash

#### Scenario: Chord on a space
- **WHEN** a line reads "grace,[C] how"
- **THEN** "C" sits over the space after "grace,", and "how" starts past it

### Requirement: Lines wrap between words
A line wider than the view SHALL wrap between words, and each chord SHALL stay above its letter. Wrapping SHALL NOT make the view wider than the page.

#### Scenario: Long line on a phone
- **WHEN** a line of 20 words with chords on its first and last word is shown 320px wide
- **THEN** it wraps over several rows, each chord stays over its letter, and the page doesn't scroll sideways

### Requirement: Even line rhythm
Every row of lyrics SHALL have a chord row above it, with or without chords, also the rows of a wrapped line. A line of chords only SHALL have no empty row of lyrics below it.

#### Scenario: Line without chords
- **WHEN** a section has a line without chords between two lines with chords
- **THEN** the three lines are the same distance apart

#### Scenario: Line of chords only
- **WHEN** a line has the chords "G C D G" and no lyrics, followed by a line with lyrics
- **THEN** the chord row is followed directly by the next line's chord row, without an empty row between

### Requirement: Chords stay with their lyrics in print
When a sheet is printed, a line's chords SHALL stay on the same page as its lyrics, and lines SHALL wrap to the paper's width.

#### Scenario: Page break
- **WHEN** a sheet longer than one page is printed
- **THEN** each line's chord row is on the same page as its lyrics

### Requirement: Lyrics only
The view SHALL be able to show a sheet's lyrics only. It SHALL then show the section labels and each line's lyrics, without chords and without chord rows, so the lines sit close together. Lines of chords only SHALL be left out. A section with only such lines SHALL be left out, label included. Like the full view, it SHALL need no JavaScript.

#### Scenario: Lines of chords only
- **WHEN** a sheet has an "Intro" of "G C G D" only, and a "Verse 1" ending in a line of the chords "C G D", shown as lyrics only
- **THEN** the view starts with "Verse 1", shows its lyrics without a chord name, and has no row for the line "C G D"

#### Scenario: Close lines
- **WHEN** "Verse 1" of "Amazing Grace" is shown as lyrics only
- **THEN** each line follows the one before it without an empty chord row between them
