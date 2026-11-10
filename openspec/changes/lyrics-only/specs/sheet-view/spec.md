## ADDED Requirements

### Requirement: Lyrics only
The view SHALL be able to show a sheet's lyrics only. It SHALL then show the section labels and each line's lyrics, without chords and without chord rows, so the lines sit close together. Lines of chords only SHALL be left out. A section with only such lines SHALL be left out, label included. Like the full view, it SHALL need no JavaScript.

#### Scenario: Lines of chords only
- **WHEN** a sheet has an "Intro" of "G C G D" only, and a "Verse 1" ending in a line of the chords "C G D", shown as lyrics only
- **THEN** the view starts with "Verse 1", shows its lyrics without a chord name, and has no row for the line "C G D"

#### Scenario: Close lines
- **WHEN** "Verse 1" of "Amazing Grace" is shown as lyrics only
- **THEN** each line follows the one before it without an empty chord row between them
