# Spec Delta

## Purpose

The home page at `/`: what Sheet Library is, that it is not ready yet, and a way into the chord editor.

## ADDED Requirements

### Requirement: Says what the site is
The home page SHALL say that Sheet Library is a library for sheet music and that it is coming soon.

#### Scenario: Opening the home page
- **WHEN** a visitor opens `/`
- **THEN** the page's heading reads "A library for your sheet music" and the text says it is coming soon

### Requirement: Sample sheet
The home page SHALL show a short sample of a chord sheet, with chords above the lyrics. The sample SHALL be hidden from screen readers, since it is decoration.

#### Scenario: Screen reader
- **WHEN** a screen reader reads the home page
- **THEN** it reads the heading, the text and the link to the editor, but not the sample's lyrics or chords
