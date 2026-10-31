# sheet-envelope Specification

## Purpose

Defines the parts of a sheet that are the same for every format: its id, its revision and its details, around content that belongs to one format.

## Requirements

### Requirement: Sheet envelope
A sheet SHALL be JSON with an id, a revision, a title, an optional artist and its content. The content SHALL name its format, such as `chordsheet`, and follow that format's model. Library features SHALL use only the envelope's fields, never the content.

#### Scenario: Chord sheet in an envelope
- **WHEN** the chord sheet "Amazing Grace" is stored as a sheet
- **THEN** the sheet holds its id, its revision, the title "Amazing Grace" and the chord sheet content with the format `chordsheet`

### Requirement: Title and artist
A sheet SHALL have a title, which SHALL be text. A sheet MAY have an artist, the performer, which SHALL be text. A sheet without an artist SHALL be stored without one.

#### Scenario: No artist
- **WHEN** a sheet with the title "Amazing Grace" and no artist is stored
- **THEN** it holds the title and no artist

#### Scenario: Missing title
- **WHEN** a sheet without a title is checked
- **THEN** a problem is reported for the title

### Requirement: Shown details are not stored
A line that shows a sheet's details, such as "Amazing Grace · Chris Tomlin", SHALL be worked out from the details when it is shown. It SHALL NOT be stored in the sheet.

#### Scenario: Artist changes
- **WHEN** a sheet's artist is changed from "Chris Tomlin" to "Judy Collins"
- **THEN** the sheet holds only the new artist, and no stored line still names the old one

### Requirement: Revision
A sheet SHALL hold its revision, a whole number. A sheet with a revision that isn't a whole number SHALL be reported when checked.

#### Scenario: Revision that isn't a whole number
- **WHEN** a sheet with the revision 2.5 is checked
- **THEN** a problem is reported for the revision

### Requirement: Sheet id
A sheet's id SHALL be 12 characters, each a letter from A to Z or a to z, a digit, `-` or `_`, so it can be used in a URL as it is. The model SHALL make new ids at random. A sheet with any other id SHALL be reported when checked.

#### Scenario: New id
- **WHEN** two new ids are made
- **THEN** each is 12 characters from the allowed set, and they differ

#### Scenario: Id with a slash
- **WHEN** a sheet with the id "abc/def12345" is checked
- **THEN** a problem is reported for the id

### Requirement: Checking a sheet envelope
The model SHALL check a sheet against the rules of the envelope and of its content's format, and report each problem it finds. Content in a format the model doesn't know SHALL be reported.

#### Scenario: Problems in envelope and content
- **WHEN** a sheet without a title and with an empty line in its chord sheet content is checked
- **THEN** both problems are reported

#### Scenario: Unknown format
- **WHEN** a sheet whose content has the format "musicxml" is checked
- **THEN** a problem is reported for the content's format
