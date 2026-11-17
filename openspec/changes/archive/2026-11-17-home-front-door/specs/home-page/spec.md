# Spec Delta

## MODIFIED Requirements

### Requirement: Says what the site is
The home page SHALL say what Sheet Library is for, with the heading "Every song you play, in one place" and the line "Keep your chord sheets in one library. Change the key, add a capo, and play from any screen." It SHALL list three things the app does: "Add sheets from photos or from Ultimate Guitar", "Save a key for each singer" and "Group sheets in collections". It SHALL NOT say that the app is coming soon.

#### Scenario: Opening the home page
- **WHEN** a visitor opens `/`
- **THEN** the page's heading reads "Every song you play, in one place", the three things are listed, and "Coming soon" is nowhere on the page

### Requirement: Sample sheet
The home page SHALL show a sample sheet in a card: the title "Amazing Grace", the artist "John Newton", the Key and Capo buttons, and the first section of the editor's sample song with its label, shown with the sheet view. Below the card, the page SHALL say "A sample sheet. Try changing the key." The card SHALL be named "Sample sheet", and screen readers SHALL read it, buttons and lyrics included.

#### Scenario: Sample section
- **WHEN** a visitor opens `/`
- **THEN** the card shows "Amazing Grace", "John Newton", "Key G", "Capo", the label "Verse 1" and the four lines of the first verse, with their chords

#### Scenario: Screen reader
- **WHEN** a screen reader reads the home page
- **THEN** it reads a part named "Sample sheet", with its buttons and the lyrics of the first verse

## ADDED Requirements

### Requirement: Ways in
The home page SHALL offer "Sign in", which opens the sign-in page, and "Try it first", which opens `/editor`.

#### Scenario: Signing in
- **WHEN** a visitor picks "Sign in" below the heading's line
- **THEN** the sign-in page opens

#### Scenario: Trying it first
- **WHEN** a visitor picks "Try it first"
- **THEN** `/editor` opens

### Requirement: Transposing the sample
The sample's Key and Capo buttons SHALL show the sample in another key or with a capo, as on the play view: the key panel offers the keys, the steps and "Back to G", without "Change". Nothing SHALL be saved, and the page's address SHALL stay `/`.

#### Scenario: Picking a key
- **WHEN** a visitor opens the Key button on the sample and picks A
- **THEN** the button reads "Key A · +2", the chords move to A, and the address is still `/`

#### Scenario: Reloading
- **WHEN** a visitor picks A on the sample, then reloads the page
- **THEN** the sample shows in G again

### Requirement: Order in one column
In a window narrower than 1024px, such as a phone or an upright tablet, the home page SHALL be one column: the heading, the line and the ways in, then the sample, then the three things the app does. From 1024px, the text, the ways in and the three things SHALL sit beside the sample.

#### Scenario: Phone
- **WHEN** a visitor opens `/` in a window 390px wide
- **THEN** the sample comes right after "Try it first", and the three things come after the sample
