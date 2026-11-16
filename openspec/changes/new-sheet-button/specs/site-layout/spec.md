# Spec Delta

## MODIFIED Requirements

### Requirement: Rail on wide screens
In a window at least 1024px wide, the navigation SHALL be a rail at the left. It SHALL start with the site's name, as a link to `/sheets`, followed by the button "New sheet". Under "Collections" it SHALL list the person's collections A to Z, each with its name and how many sheets it holds, as a link to its page.

#### Scenario: Collections in the rail
- **WHEN** a person has "Christmas" with 14 sheets and "Campfire" with 21
- **THEN** the rail lists "Campfire" with 21, then "Christmas" with 14, under "Collections"

#### Scenario: A new collection
- **WHEN** a person makes the collection "Lullabies"
- **THEN** the rail lists "Lullabies", marked

#### Scenario: New sheet on another screen
- **WHEN** a person on the collection "Christmas", in a window 1280px wide, selects "New sheet" in the rail
- **THEN** the menu opens with "Write a new sheet", "From photos…" and "From Ultimate Guitar…"

### Requirement: Rail with icons on middle screens
In a window from 641px to 1023px wide, the rail SHALL show icons for "Sheets", "Collections" and the account, each with its name under it. It SHALL start with a menu button named "Open navigation", followed by a square button with a plus, named "New sheet", that opens the same menu as on wide screens. The rail SHALL NOT list the collections or show the site's name.

#### Scenario: On a tablet
- **WHEN** a person opens `/sheets` in a window 800px wide
- **THEN** the rail shows "Open navigation", "New sheet", then "Sheets", "Collections" and "Account" with their icons, and the link "Collections" opens `/collections`

### Requirement: Bottom bar on phones
In a window up to 640px wide, the navigation SHALL be a bar at the bottom of the screen, with "Sheets" and "Collections", each with its icon and its name. The floating "New sheet" SHALL sit above the bar.

#### Scenario: On a phone
- **WHEN** a person on a phone opens `/sheets`
- **THEN** the bar at the bottom shows "Sheets", marked, and "Collections", and the button "New sheet" floats above it

### Requirement: Focus follows the page
After a move to another page without a full load, focus SHALL be on that page's heading, and the page SHALL NOT scroll for it. A page that places focus itself SHALL keep it.

#### Scenario: Opening Collections
- **WHEN** a person on `/sheets` selects "Collections" in the navigation
- **THEN** focus is on the heading "Collections"

#### Scenario: Opening a sheet
- **WHEN** a person selects the row "Amazing Grace" on `/sheets`
- **THEN** focus is on the heading "Amazing Grace"

#### Scenario: A new sheet
- **WHEN** a person selects "New sheet", then "Write a new sheet"
- **THEN** focus is in the title field, with "Untitled" selected

#### Scenario: Going back
- **WHEN** a person scrolls down the list on `/sheets`, opens a sheet from a row and goes back
- **THEN** the list shows where it was scrolled to

### Requirement: Closing the opened rail
The opened rail SHALL close when an entry is picked, on "Close", on Escape, on a tap on the dimmed page, and when the window becomes narrower than 641px or wider than 1023px. It SHALL also close when a way is picked from its "New sheet" menu, before that way's dialog or the new sheet opens. Unless an entry or a way was picked, focus SHALL go back to "Open navigation".

#### Scenario: Closing with Escape
- **WHEN** a person opens the rail in a window 800px wide and presses Escape
- **THEN** the rail closes, and focus is on "Open navigation"

#### Scenario: A way picked from the opened rail
- **WHEN** a person in a window 800px wide selects "Open navigation", then "New sheet", then "From photos…"
- **THEN** the rail closes, and the dialog "Import from photos" opens over the page

## ADDED Requirements

### Requirement: New sheet floating on phones
In a window up to 640px wide, "New sheet" SHALL be one square button with a plus, floating above the bottom bar at the right, on every screen in the shell. It SHALL open the same three ways as in the rail. The empty library SHALL show its cards and no floating button.

#### Scenario: On Collections
- **WHEN** a person with collections opens `/collections` on a phone
- **THEN** the floating button is "New sheet", and it opens "Write a new sheet", "From photos…" and "From Ultimate Guitar…"

#### Scenario: Empty library on a phone
- **WHEN** a person who has no sheets opens `/sheets` on a phone
- **THEN** the page shows the three cards and no floating button

### Requirement: Add buttons beside the heading
"New collection" on Collections and "Add sheets" on a collection SHALL sit beside their screen's heading at every width, and SHALL NOT float. With no collections, or in an empty collection, the button SHALL be in the empty state instead.

#### Scenario: On a collection on a phone
- **WHEN** a person opens the collection "Christmas", which holds 14 sheets, on a phone
- **THEN** "Add sheets" is beside the heading, and the floating button is "New sheet"

### Requirement: The "New sheet" menu on phones
On a phone, "New sheet" SHALL open its three ways as large buttons stacked above it, over the dimmed screen, and turn into a "Close" button while they are open. Escape, "Close" and a tap on the dimmed screen SHALL close them, with focus back on "New sheet".

#### Scenario: Opening the menu on a phone
- **WHEN** a person on a phone selects "New sheet"
- **THEN** "Write a new sheet", "From photos…" and "From Ultimate Guitar…" show above the button over the dimmed screen, and the button reads "Close"
