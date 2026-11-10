# Spec Delta

## MODIFIED Requirements

### Requirement: Sample sheet
The home page SHALL show a short sample of a chord sheet: the first section of the editor's sample song, with its label, shown with the sheet view. The sample SHALL be hidden from screen readers, since it is decoration.

#### Scenario: Screen reader
- **WHEN** a screen reader reads the home page
- **THEN** it reads the heading, the text and the link to the editor, but not the sample's lyrics or chords

#### Scenario: Sample section
- **WHEN** a visitor opens `/`
- **THEN** the sample shows the label "Verse 1" and the four lines of the first verse of "Amazing Grace", with their chords
