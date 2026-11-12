# Spec Delta

## MODIFIED Requirements

### Requirement: Sheet envelope
A sheet SHALL be JSON with an id, a revision, a title, an optional artist and its content. The content SHALL name its format, such as `chordsheet`, and follow that format's model. Library features SHALL use only the envelope's fields and the plain text the content's format gives, such as its lyrics. They SHALL NOT read the content themselves.

#### Scenario: Chord sheet in an envelope
- **WHEN** the chord sheet "Amazing Grace" is stored as a sheet
- **THEN** the sheet holds its id, its revision, the title "Amazing Grace" and the chord sheet content with the format `chordsheet`

#### Scenario: Searching lyrics
- **WHEN** the library searches the lyrics of a chord sheet
- **THEN** it uses the lyrics the `chordsheet` format gives, not the sections and lines of the content
