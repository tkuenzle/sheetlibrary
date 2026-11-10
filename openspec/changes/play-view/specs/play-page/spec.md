# Spec Delta

## Purpose

The page where the owner of a sheet plays it or prints it: the sheet in large text without editing tools, with a key, a capo and a text size that change only what is shown.

## ADDED Requirements

### Requirement: A sheet to play
The page at `/sheets/:id` SHALL show the owner's sheet with the read-only sheet view, its title as the heading and in the browser tab, and its artist below the title. The lyrics SHALL be larger than in the editor. The page SHALL NOT show editing tools, the save state or the help.

#### Scenario: Opening a sheet
- **WHEN** the owner opens `/sheets/:id` for their sheet "Amazing Grace" by John Newton
- **THEN** the heading reads "Amazing Grace" with "John Newton" below it, the tab reads "Amazing Grace | Sheet Library", and a click on the lyrics doesn't start editing

### Requirement: Who can open the play view
A visitor who isn't signed in SHALL be sent to the sign-in page. A signed-in person who opens an id that isn't one of their sheets SHALL see a "not found" page. The page SHALL ask search engines not to index it.

#### Scenario: Someone else's sheet
- **WHEN** a person opens `/sheets/:id` for a sheet another person owns
- **THEN** they see a "not found" page

### Requirement: Complete before JavaScript
The page SHALL show the sheet complete from its HTML and CSS, in the key and with the capo its address holds.

#### Scenario: Opened in another key
- **WHEN** the owner opens `/sheets/:id?key=A&capo=2` for a sheet in G, with JavaScript turned off
- **THEN** the chords show the shapes for capo 2 in A, and the key button reads "Key A · +2"

### Requirement: Key and capo for the view only
The play view SHALL have the key button and the capo button, which transpose and set a capo as on the editor page. Their panels SHALL NOT offer to change the song key or to make the shown key the song key. A transpose or a capo SHALL NOT change the stored sheet.

#### Scenario: Transposing to play
- **WHEN** the owner picks A in the key panel of a sheet in G, then opens the sheet in the editor from the library
- **THEN** the play view showed the chords in A, and the editor shows them in G

### Requirement: Without loading the page again
A transpose or a capo on the play view SHALL show the new chords at once, without loading the page again. The chords SHALL get room as in the read-only sheet view. The address SHALL follow the key and the capo, as on the editor page.

#### Scenario: Picking a capo
- **WHEN** the owner picks capo 2 on the play view
- **THEN** the chords show the new shapes without a page load, chord names don't overlap, and the address ends in `?capo=2`

### Requirement: Text size
"Smaller text" and "Larger text" SHALL make the sheet's lyrics and chords smaller or larger, in steps, between a smallest and a largest size. The size SHALL be kept on the device, for every sheet's play view.

#### Scenario: Larger on this device
- **WHEN** the owner picks "Larger text" twice, then opens another sheet's play view
- **THEN** that sheet shows in the larger size too

### Requirement: Printing
"Print" SHALL open the browser's print, which can also save a PDF. The printed page SHALL show the title, the artist and the sheet in the key and with the capo shown. It SHALL NOT show the top bar or the page's buttons.

#### Scenario: Printing in another key
- **WHEN** the owner shows a sheet in G in A and picks "Print"
- **THEN** the print preview shows the title, the artist and the chords in A, and no buttons

### Requirement: Controls on a phone
On a phone, "Smaller text", "Larger text" and "Print" SHALL sit in a menu after the key and capo buttons.

#### Scenario: Printing from a phone
- **WHEN** the owner opens the menu on a phone and picks "Print"
- **THEN** the browser's print opens
