# Spec Delta

## ADDED Requirements

### Requirement: Skeleton bars
Data that is still on its way SHALL show as bars with rounded ends in a quiet color, at the size of the text they stand for. Bars for chords and keys SHALL use the soft accent. The bars SHALL pulse slowly, by fading only.

#### Scenario: A row that loads
- **WHEN** a row of the sheet list is still loading
- **THEN** it shows a bar for the title, a shorter one for the artist and a small one in the soft accent for the key, and they pulse

## MODIFIED Requirements

### Requirement: Still with reduced motion
When the system asks for reduced motion, nothing on any page SHALL move or fade. Panels, menus, dialogs, inputs and switches SHALL open, close and change at once, and so SHALL pages. Signs that something is going on, such as the loading bar, the photo import's sign and skeleton bars, SHALL stand still.

#### Scenario: Opening the navigation
- **WHEN** reduced motion is on and a visitor opens the full rail in a window 800px wide
- **THEN** the rail and the dimmed page show right away, without sliding or fading in

#### Scenario: Lyrics only
- **WHEN** reduced motion is on and a visitor turns on "Lyrics only" in View
- **THEN** the switch's handle is at its end right away

#### Scenario: Opening a sheet
- **WHEN** reduced motion is on and a person selects a row on `/sheets`
- **THEN** the sheet shows right away, without rising

#### Scenario: Closing a dialog
- **WHEN** reduced motion is on and a person picks "Cancel" in a dialog
- **THEN** the dialog and the scrim are gone right away

#### Scenario: A page that loads
- **WHEN** reduced motion is on and a collection's sheets are slow to arrive
- **THEN** its rows of bars stand still
