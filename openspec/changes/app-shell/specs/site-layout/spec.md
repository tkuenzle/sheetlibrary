# Spec Delta

## ADDED Requirements

### Requirement: The shell
The screens at `/sheets`, `/collections`, `/collections/:id` and `/account` SHALL sit in one shell: the navigation and the screen's content. A move between them SHALL change only the content, without loading the page in full. The shell's screens SHALL NOT show the top bar.

#### Scenario: From Sheets to Collections
- **WHEN** a signed-in person on `/sheets` selects "Collections" in the navigation
- **THEN** `/collections` opens, and the navigation stays on screen

#### Scenario: No top bar
- **WHEN** a signed-in person opens `/account`
- **THEN** the page shows the navigation and no top bar

### Requirement: Navigation in the shell
The navigation SHALL link to "Sheets" at `/sheets` and "Collections" at `/collections`, and SHALL mark the one that is open. On a collection's page it SHALL mark that collection where the collections are listed, and "Collections" where they aren't.

#### Scenario: The open screen
- **WHEN** a person opens `/collections`
- **THEN** "Collections" is marked as the current page, and "Sheets" isn't

#### Scenario: A collection on a phone
- **WHEN** a person on a phone opens the collection "Christmas"
- **THEN** the bottom bar marks "Collections"

### Requirement: Rail on wide screens
In a window at least 1024px wide, the navigation SHALL be a rail at the left. It SHALL start with the site's name, as a link to `/sheets`. Under "Collections" it SHALL list the person's collections A to Z, each with its name and how many sheets it holds, as a link to its page.

#### Scenario: Collections in the rail
- **WHEN** a person has "Christmas" with 14 sheets and "Campfire" with 21
- **THEN** the rail lists "Campfire" with 21, then "Christmas" with 14, under "Collections"

#### Scenario: A new collection
- **WHEN** a person makes the collection "Lullabies"
- **THEN** the rail lists "Lullabies", marked

### Requirement: A long list of collections
When the collections don't fit the rail's height, their list SHALL scroll on its own. The site's name and the account SHALL stay in view.

#### Scenario: Forty collections
- **WHEN** a person with 40 collections scrolls the rail's list to its end
- **THEN** the site's name and the account are still in view

### Requirement: Rail with icons on middle screens
In a window from 641px to 1023px wide, the rail SHALL show only icons for "Sheets", "Collections" and the account. Each SHALL keep its name for screen readers and show it in a tooltip. The rail SHALL NOT list the collections or show the site's name.

#### Scenario: On a tablet
- **WHEN** a person opens `/sheets` in a window 800px wide
- **THEN** the rail shows three icons, and the link named "Collections" opens `/collections`

### Requirement: Bottom bar on phones
In a window up to 640px wide, the navigation SHALL be a bar at the bottom of the screen, with "Sheets", "Collections" and the account, each with its icon and its name. Buttons docked at the bottom of a screen SHALL sit above the bar.

#### Scenario: On a phone
- **WHEN** a person on a phone opens `/sheets`
- **THEN** the bar at the bottom shows "Sheets", marked, "Collections" and "Account", and "New sheet" sits above it

### Requirement: Account in the shell
The shell SHALL show the first letter of the person's email, in upper case and in a circle, as a link named "Account" to the account page. It SHALL sit at the bottom of the rail, and at the end of the bottom bar on phones. On the account page, it SHALL be marked as the current page.

#### Scenario: On a phone
- **WHEN** ana@example.com, signed in on a phone, opens `/sheets`
- **THEN** the bottom bar ends with "A" as a link named "Account"

#### Scenario: On the account page
- **WHEN** a person opens `/account` on a wide screen
- **THEN** "Account" in the rail is marked as the current page, and "Sheets" and "Collections" aren't

### Requirement: Skip to content
The shell's first link SHALL be "Skip to content". It SHALL show only while it has focus, and SHALL move focus to the screen's content.

#### Scenario: Skipping the rail
- **WHEN** a person opens `/sheets`, presses Tab once and then Enter
- **THEN** focus is on the content, past the navigation

### Requirement: Focus follows the page
After a move to another page without a full load, focus SHALL be on that page's heading, and the page SHALL NOT scroll for it. A page that places focus itself SHALL keep it.

#### Scenario: Opening Collections
- **WHEN** a person on `/sheets` selects "Collections" in the navigation
- **THEN** focus is on the heading "Collections"

#### Scenario: Opening a sheet
- **WHEN** a person selects the row "Amazing Grace" on `/sheets`
- **THEN** focus is on the heading "Amazing Grace"

#### Scenario: A new sheet
- **WHEN** a person selects "New sheet"
- **THEN** focus is in the title field, with "Untitled" selected

#### Scenario: Going back
- **WHEN** a person scrolls down the list on `/sheets`, opens a sheet from a row and goes back
- **THEN** the list shows where it was scrolled to

## MODIFIED Requirements

### Requirement: Top bar
The home page, `/editor` and a sheet's pages SHALL show a top bar. It SHALL start with the name "Sheet Library" as a link to the home page, or to the library at `/sheets` once the visitor is signed in. On a sheet, at `/sheets/:id` or `/sheets/:id/edit`, it SHALL start with "Library" and a back arrow instead, as a link to the library. The top bar SHALL NOT show the song's title. The sign-in page SHALL show the site's name, linking to the home page, above its card instead.

#### Scenario: Going home from the editor
- **WHEN** a visitor on `/editor` clicks "Sheet Library" in the top bar
- **THEN** the home page opens

#### Scenario: Back to the library
- **WHEN** a signed-in person on a sheet clicks "Library" in the top bar
- **THEN** the library opens

#### Scenario: No title in the bar
- **WHEN** a signed-in person opens the sheet "Amazing Grace"
- **THEN** the top bar starts with "Library", and neither "Sheet Library" nor "Amazing Grace" is in it

#### Scenario: Sign-in page
- **WHEN** a visitor opens the sign-in page
- **THEN** the page has no top bar, and "Sheet Library" above the sign-in card opens the home page

### Requirement: Account link in the top bar
The top bar SHALL show a "Sign in" link to the sign-in page when the visitor isn't signed in. When they are signed in, it SHALL show the first letter of their email, in upper case and in a circle, as a link named "Account" to their account page.

#### Scenario: Signed out
- **WHEN** a visitor who isn't signed in opens the home page
- **THEN** the top bar shows "Sign in", which opens the sign-in page

#### Scenario: Signed in
- **WHEN** ana@example.com, signed in, opens a sheet
- **THEN** the top bar shows "A" as a link named "Account" to the account page, and no "Sign in"

## REMOVED Requirements

### Requirement: Back to the collections
**Reason**: A collection's page sits in the shell and has no top bar. The navigation marks the collection, or "Collections", and leads back.
**Migration**: Use "Collections" in the rail or the bottom bar.
