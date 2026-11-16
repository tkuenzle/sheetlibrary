# site-layout Specification

## Purpose

The frame shared by the site's pages: the shell with the navigation around the library's screens and the account page, and the top bar on the home page and a sheet.

## Requirements

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

### Requirement: Play and Edit
On a sheet's two pages, the top bar SHALL show "Play" and "Edit" after "Library", as one switch with the current page marked. "Play" SHALL open `/sheets/:id` and "Edit" `/sheets/:id/edit`, each with the key and the capo shown now. On a phone, the switch SHALL show only their icons, still named "Play" and "Edit".

#### Scenario: From playing to editing
- **WHEN** the owner shows a sheet in A with capo 2 on the play view and picks "Edit"
- **THEN** the editor opens with the sheet in A and capo 2, and "Edit" is marked

#### Scenario: Back to playing
- **WHEN** the owner picks "Play" in the editor after their edits are saved
- **THEN** the play view opens with the edits

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
In a window from 641px to 1023px wide, the rail SHALL show icons for "Sheets", "Collections" and the account, each with its name under it. It SHALL start with a menu button named "Open navigation". The rail SHALL NOT list the collections or show the site's name.

#### Scenario: On a tablet
- **WHEN** a person opens `/sheets` in a window 800px wide
- **THEN** the rail shows "Open navigation", then "Sheets", "Collections" and "Account" with their icons, and the link "Collections" opens `/collections`

### Requirement: Opening the rail on middle screens
In a window from 641px to 1023px wide, "Open navigation" SHALL open the full rail over the dimmed page, as wide screens show it, with a "Close" button next to the site's name. It SHALL be modal: focus SHALL move into it, and the page behind it SHALL be inert. It SHALL slide in from the left, except with reduced motion.

#### Scenario: Opening a collection from the opened rail
- **WHEN** a person on `/sheets`, in a window 800px wide, selects "Open navigation" and then "Christmas"
- **THEN** the rail closes, and the collection "Christmas" opens

### Requirement: Closing the opened rail
The opened rail SHALL close when an entry is picked, on "Close", on Escape, on a tap on the dimmed page, and when the window becomes narrower than 641px or wider than 1023px. Unless an entry was picked, focus SHALL go back to "Open navigation".

#### Scenario: Closing with Escape
- **WHEN** a person opens the rail in a window 800px wide and presses Escape
- **THEN** the rail closes, and focus is on "Open navigation"

### Requirement: Bottom bar on phones
In a window up to 640px wide, the navigation SHALL be a bar at the bottom of the screen, with "Sheets" and "Collections", each with its icon and its name. Buttons docked at the bottom of a screen SHALL sit above the bar.

#### Scenario: On a phone
- **WHEN** a person on a phone opens `/sheets`
- **THEN** the bar at the bottom shows "Sheets", marked, and "Collections", and "New sheet" sits above it

### Requirement: Account in the shell
The shell SHALL show the first letter of the person's email, in upper case and in a circle, as a link named "Account" to the account page. It SHALL sit at the bottom of the rail, and at the top right of the screen on phones, on the line of the heading. On the account page, it SHALL be marked as the current page.

#### Scenario: On a phone
- **WHEN** ana@example.com, signed in on a phone, opens `/sheets`
- **THEN** "A" shows at the top right, beside the heading "Sheets", as a link named "Account"

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

### Requirement: Loading bar
While a move to another page without a full load takes more than 200ms, a thin bar SHALL show across the top of the window, the same on every page, until the new page shows. A move that is faster SHALL NOT show it. With reduced motion, the bar SHALL NOT slide.

#### Scenario: A slow move
- **WHEN** a person on `/sheets` selects "Collections" and the page takes two seconds to load
- **THEN** the bar shows at the top of the window until Collections shows

#### Scenario: A fast move
- **WHEN** a person selects "Collections" and the page loads in 100ms
- **THEN** no bar shows

### Requirement: Local waits keep their own sign
The loading bar SHALL NOT show while a wait belongs to one place on the page. A search on `/sheets` SHALL keep "Searching…" in the field and SHALL NOT show the bar.

#### Scenario: A slow search
- **WHEN** a person types "grace" on `/sheets` and the results take two seconds to arrive
- **THEN** the field says "Searching…" and no bar shows

### Requirement: Errors inside the frame
When a page can't be loaded, its content SHALL give way to a note, and the frame SHALL stay: in the shell, the navigation; on a sheet's pages, the top bar. When the server can't be reached, the note SHALL say "Can’t reach Sheet Library" and "Check your connection and try again."; otherwise "Something went wrong". The note SHALL offer "Try again", which loads the same address again.

#### Scenario: Offline in the shell
- **WHEN** a person without a connection selects the collection "Christmas" in the rail
- **THEN** the rail stays, with "Christmas" marked, and the content says "Can’t reach Sheet Library" with "Try again"

#### Scenario: Back online
- **WHEN** the connection is back and the person selects "Try again"
- **THEN** the collection "Christmas" shows

### Requirement: Page not found
An address that matches no page SHALL respond with a 404 status and show the site's name, the heading "Page not found" and "This address doesn’t lead to a page in Sheet Library." It SHALL link to "Go to your sheets" at `/sheets` when the visitor is signed in, and "Go to the home page" at `/` when not. The page SHALL ask search engines not to index it.

#### Scenario: A mistyped address
- **WHEN** a signed-in person opens `/shets`
- **THEN** the page says "Page not found", and "Go to your sheets" opens `/sheets`

#### Scenario: Signed out
- **WHEN** a visitor who isn't signed in opens `/shets`
- **THEN** the page links "Go to the home page" to `/`
