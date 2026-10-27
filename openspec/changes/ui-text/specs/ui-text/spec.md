# Spec Delta

## Purpose

The voice and the glossary that the site's UI text follows, so the same thing has the same name everywhere and the text reads the same on every page.

## ADDED Requirements

### Requirement: Plain voice
The UI text SHALL be plain: everyday words, imperative, without "we", "please", "you can" or exclamation marks. Labels SHALL be a verb and a noun. Help lines SHALL be one instruction without a period. Only notes and page text SHALL be full sentences.

#### Scenario: Home page
- **WHEN** a visitor reads the home page's text
- **THEN** it says the library is coming soon and asks them to try the chord editor, without "you can"

### Requirement: One word for each thing
The UI text SHALL use the glossary's words: "sheet", not "song"; "cursor", not "caret"; "edit", not "change", for sections and chords alike.

#### Scenario: Help for chords
- **WHEN** a visitor reads the help
- **THEN** it says to add a chord at the cursor and to tap or click a chord to edit it, and never says "caret" or "change"

### Requirement: Text belongs to the app
The `chord-editor` package SHALL hold no UI text. Any word it shows or has read out SHALL come from the app.

#### Scenario: Package without the app's words
- **WHEN** the package is used without the app setting the badge's word
- **THEN** a screen reader reads only the section's number
