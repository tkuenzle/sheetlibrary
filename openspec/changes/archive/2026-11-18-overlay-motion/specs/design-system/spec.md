# Spec Delta

## ADDED Requirements

### Requirement: Menus grow from their button
A menu, a panel that opens under its button on wider screens such as the key panel, and the chord input, which opens under its letter on wider screens, SHALL fade in and grow a little from the side of the button or letter. Closing SHALL play the same move backwards, faster than it came in.

#### Scenario: Opening the sheet's menu
- **WHEN** a person on a sheet selects "More for this sheet"
- **THEN** the menu fades in and grows from its top right corner, under the button

#### Scenario: Closing the key panel
- **WHEN** a person in a window 1200px wide closes the key panel with Escape
- **THEN** the panel fades out and shrinks towards its button, faster than it opened

#### Scenario: Opening the chord input
- **WHEN** a person with a mouse, in a window 1200px wide, opens the chord input on a letter
- **THEN** it fades in and grows from its top left corner, under the letter

### Requirement: Dialogs grow from the centre
A dialog SHALL fade in and grow a little from its centre, over a scrim that fades in. Closing SHALL play the same move backwards, faster than it came in. A confirm dialog whose action worked SHALL NOT play its exit when the page leaves.

#### Scenario: Asking before a delete
- **WHEN** a person picks "Delete" in a sheet's menu
- **THEN** the question fades in and grows from the centre while the page dims

#### Scenario: Cancel
- **WHEN** the person then picks "Cancel"
- **THEN** the question fades out and shrinks, and the scrim fades out, faster than they came in

### Requirement: Bottom sheets slide from the bottom
On a phone, a dialog that shows as a sheet at the bottom of the screen, such as photo import, SHALL slide up from the bottom edge over a scrim that fades in, and slide back down when it closes, faster than it came in.

#### Scenario: Photo import on a phone
- **WHEN** a person on a phone picks "From photos…"
- **THEN** "Import from photos" slides up from the bottom while the page dims

### Requirement: Leaving takes no taps
While a menu, panel, dialog or sheet plays its exit, it SHALL NOT take taps, clicks or keys. A menu or panel that leaves the page usable behind it SHALL move focus back as it starts to leave; a modal one SHALL move focus back once it is gone.

#### Scenario: Cancel pressed twice
- **WHEN** a person picks "Cancel" in a dialog and taps it again while the dialog leaves
- **THEN** the second tap does nothing, and once the dialog is gone focus is on the button that opened it

#### Scenario: Leaving a menu
- **WHEN** a person closes "More for this sheet" with Escape
- **THEN** focus is on "More for this sheet" while the menu still fades out

## MODIFIED Requirements

### Requirement: Still with reduced motion
When the system asks for reduced motion, nothing on any page SHALL move or fade. Panels, menus, dialogs, inputs and switches SHALL open, close and change at once, and so SHALL pages. Signs that something is going on, such as the loading bar and the photo import's sign, SHALL stand still.

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
