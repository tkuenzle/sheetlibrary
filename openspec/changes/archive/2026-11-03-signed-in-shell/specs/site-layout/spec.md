## MODIFIED Requirements

### Requirement: Top bar
Every page except the sign-in page and the `/design` page SHALL show a top bar. It SHALL start with the name "Sheet Library" as a link to the home page, or to the library at `/sheets` once the visitor is signed in. On a sheet at `/sheets/:id`, it SHALL start with "Library" and a back arrow instead, as a link to the library. The top bar SHALL NOT show the song's title. The sign-in page SHALL show the site's name, linking to the home page, above its card instead.

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
The top bar SHALL show a "Sign in" link to the sign-in page when the visitor isn't signed in. When they are signed in, it SHALL show the first letter of their email, in upper case and in a circle, as a link named "Account" to their account page. On the account page, the link SHALL be marked as the current page.

#### Scenario: Signed out
- **WHEN** a visitor who isn't signed in opens the home page
- **THEN** the top bar shows "Sign in", which opens the sign-in page

#### Scenario: Signed in
- **WHEN** ana@example.com, signed in, opens the home page
- **THEN** the top bar shows "A" as a link named "Account" to the account page, and no "Sign in"
