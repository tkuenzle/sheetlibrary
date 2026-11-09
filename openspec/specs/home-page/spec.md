# home-page Specification

## Purpose

The home page at `/`: what Sheet Library is, that it is not ready yet, and a way into the chord editor.

## Requirements

### Requirement: Says what the site is
The home page SHALL say that Sheet Library is a library for sheet music and that it is coming soon.

#### Scenario: Opening the home page
- **WHEN** a visitor opens `/`
- **THEN** the page's heading reads "A library for your sheet music" and the text says it is coming soon

### Requirement: Sample sheet
The home page SHALL show a short sample of a chord sheet: the first section of the editor's sample song, with its label, shown with the sheet view. The sample SHALL be hidden from screen readers, since it is decoration.

#### Scenario: Screen reader
- **WHEN** a screen reader reads the home page
- **THEN** it reads the heading, the text and the link to the editor, but not the sample's lyrics or chords

#### Scenario: Sample section
- **WHEN** a visitor opens `/`
- **THEN** the sample shows the label "Verse 1" and the four lines of the first verse of "Amazing Grace", with their chords

### Requirement: Signed-in people go to the library
A signed-in person who opens `/` SHALL be sent to the library at `/sheets`. A visitor who isn't signed in SHALL see the home page.

#### Scenario: Signed in
- **WHEN** a signed-in person opens `/`
- **THEN** the library opens
