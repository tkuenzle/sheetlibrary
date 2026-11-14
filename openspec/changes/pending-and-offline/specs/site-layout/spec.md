# Spec Delta

## ADDED Requirements

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
