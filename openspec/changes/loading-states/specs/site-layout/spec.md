# Spec Delta

## ADDED Requirements

### Requirement: A skeleton while a page loads
On a move inside the app to Sheets, a collection, a sheet or the account page, the new page SHALL show right after the tap and move in, without waiting for its data. Where data is still on its way, the page SHALL show bars inside the real row's frame, at the real row's height. When the data arrives, it SHALL take the bars' place without anything around it shifting. A page loaded in full SHALL arrive with its data, without bars.

#### Scenario: A slow collection
- **WHEN** a person on `/sheets` selects "Christmas" in the rail, and its sheets take two seconds to arrive
- **THEN** the collection's page fades in right away with bars in place of the rows, and the rows show when they arrive

#### Scenario: A first load
- **WHEN** a person opens `/collections/:id` in a new tab
- **THEN** the page arrives with its rows, without bars

### Requirement: What the skeleton already knows
A skeleton SHALL show for real what the browser already knows. A collection SHALL show its name and its number of sheets, and as many rows of bars as it has sheets, up to a screenful. A sheet opened from a row SHALL show its title and artist.

#### Scenario: A collection's count
- **WHEN** a person selects "Christmas", which holds 3 sheets, and its sheets are slow to arrive
- **THEN** the page shows "Christmas", "3 sheets" and three rows of bars

#### Scenario: A sheet from a row
- **WHEN** a person selects "Stille Nacht" on `/sheets`, and the sheet is slow to arrive
- **THEN** the sheet rises with "Stille Nacht" and its artist in the heading, and bars in place of its lines

### Requirement: No skeleton when a page loads again
A page that loads its data again without a move to another page, such as after a change on one of its rows or during a search, SHALL keep what it shows until the new data is there.

#### Scenario: After deleting from a row
- **WHEN** a person deletes a sheet from its row on `/sheets`
- **THEN** the other rows stay on screen while the list loads again

#### Scenario: Another collection
- **WHEN** a person on the collection "Christmas" selects "Campfire" in the rail, and its sheets are slow to arrive
- **THEN** the page shows "Campfire" with bars, not the sheets of "Christmas"

### Requirement: No flashing bars without a move
When a page changes without a move, as after Safari's own swipe back or with reduced motion, its bars SHALL show only when its data takes longer than 200ms; until then their room SHALL stay empty. Once shown, they SHALL stay for at least 400ms. While a move plays, the bars SHALL show from the start of the move.

#### Scenario: A quick page without a move
- **WHEN** reduced motion is on and a person selects "Christmas" in the rail, and its sheets arrive after 50ms
- **THEN** the sheets show without any bars before them

#### Scenario: A slow page without a move
- **WHEN** reduced motion is on and the sheets of "Christmas" take a second to arrive
- **THEN** bars show in the rows' room after a moment, and stay until the sheets are there

### Requirement: Bars in the dialogs that load
"Add sheets" and "Choose collections" SHALL show bars in their list while it loads, but only when it takes longer than 200ms; until then the list's room SHALL stay empty. Once shown, the bars SHALL stay for at least 400ms, so they never flash. Controls that need the list SHALL wait until it is there.

#### Scenario: Choose collections
- **WHEN** a person picks "Choose collections…" in a sheet's menu, and the collections are slow to arrive
- **THEN** the dialog shows its title and rows of bars, "New collection" can't be picked yet, and "Done" closes it

#### Scenario: A quick list
- **WHEN** a person picks "Choose collections…", and the collections arrive after 50ms
- **THEN** the collections show without any bars before them

## MODIFIED Requirements

### Requirement: No move after a long wait
When the new page's data takes longer than the loading bar waits before it shows, the page SHALL change without a move. This applies to pages without a skeleton.

#### Scenario: A slow answer
- **WHEN** a person on a slow connection selects "Edit" on a sheet, and edit mode takes a second to arrive
- **THEN** edit mode shows at once when it arrives, without a move
