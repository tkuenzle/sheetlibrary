# Spec Delta

## ADDED Requirements

### Requirement: Lyrics as plain text
The model SHALL give a sheet's lyrics as plain text: the text of each line, in order, one line each. It SHALL leave out chords and section labels. A line with only chords SHALL be left out.

#### Scenario: Two sections
- **WHEN** a sheet has a section labeled "Verse" with the lines "Amazing grace" and "How sweet the sound", each with chords, and a section with the line "Was blind"
- **THEN** its lyrics are "Amazing grace", "How sweet the sound" and "Was blind", on three lines, without the chords or "Verse"

#### Scenario: A line with only chords
- **WHEN** a sheet has a line with the chords G and C and no text, followed by the line "Amazing grace"
- **THEN** its lyrics are only "Amazing grace"
