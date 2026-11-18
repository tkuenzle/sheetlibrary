# Spec Delta

## ADDED Requirements

### Requirement: The shell's screens fade
A move between Sheets, Collections and a collection SHALL fade the content from the old screen to the new one. The navigation SHALL stay still.

#### Scenario: From Sheets to Collections
- **WHEN** a person on `/sheets` selects "Collections" in the rail
- **THEN** the list fades into Collections, and the rail doesn't move

### Requirement: A sheet rises over the shell
Opening a sheet from a row SHALL raise the sheet over the screen it was opened from. The row's title SHALL move into the sheet's heading.

#### Scenario: Opening a sheet
- **WHEN** a person on `/sheets` selects the row "Amazing Grace"
- **THEN** the sheet rises over the list, and the title "Amazing Grace" moves from the row into the heading

### Requirement: Back drops the sheet
Leaving a sheet for a screen of the shell SHALL drop the sheet and show the screen under it, faster than the sheet rose. When the screen shows the sheet's row, the heading SHALL move back into the row's title. Back by the arrow and by the browser SHALL move the same way.

#### Scenario: The browser's back
- **WHEN** a person opens "Amazing Grace" from `/sheets` and presses the browser's back
- **THEN** the sheet drops, the list shows under it, and the heading moves back into the row "Amazing Grace"

### Requirement: Edit is a mode
A move between the play view and edit mode of the same sheet SHALL NOT slide or rise. The page SHALL fade briefly into the other mode, faster than a move between pages.

#### Scenario: From playing to editing
- **WHEN** the owner picks "Edit" on the play view
- **THEN** the play view fades briefly into edit mode, without sliding

#### Scenario: Done
- **WHEN** the owner picks "Done" in edit mode
- **THEN** edit mode fades briefly into the play view, without sliding

### Requirement: No move on top of the browser's
When the browser shows its own move for going back or forward, as when swiping back on an iPhone, the page SHALL change without a move of its own.

#### Scenario: Swiping back
- **WHEN** a person on an iPhone opens a sheet from `/sheets` and swipes back from the edge
- **THEN** the list shows after the browser's swipe, without the sheet dropping again

### Requirement: No move after a long wait
When the new page's data takes longer than the loading bar waits before it shows, the page SHALL change without a move.

#### Scenario: A slow answer
- **WHEN** a person on a slow connection selects a row on `/sheets`, and the sheet takes a second to arrive
- **THEN** the sheet shows at once when it arrives, without rising

### Requirement: No move into the page that is open
A link to the page that is open SHALL NOT move.

#### Scenario: The page that is open
- **WHEN** a person on `/sheets` goes back from a sheet and then selects "Sheet Library"
- **THEN** Sheets shows again without a move
