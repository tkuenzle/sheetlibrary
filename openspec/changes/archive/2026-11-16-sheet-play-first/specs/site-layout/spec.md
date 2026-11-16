# Spec Delta

## ADDED Requirements

### Requirement: Back on a sheet
On the play view, Back SHALL be an arrow named "Back". When the sheet was reached by a move inside the app, Back SHALL go back in the browser's history, so the page before shows as it was left, with its search and scroll. Otherwise, as after opening a link or a bookmark, Back SHALL open `/sheets`.

#### Scenario: Back to a search
- **WHEN** a person searches "grace" on `/sheets`, scrolls, opens "Amazing Grace" and picks Back
- **THEN** `/sheets` shows the results for "grace", scrolled where they were

#### Scenario: Opened from a link
- **WHEN** a person opens a sheet's address in a new tab and picks Back
- **THEN** `/sheets` opens

## MODIFIED Requirements

### Requirement: Top bar
The home page, `/editor` and a sheet's pages SHALL show a top bar. It SHALL start with the name "Sheet Library" as a link to the home page, or to the library at `/sheets` once the visitor is signed in. On a sheet's play view it SHALL start with Back instead, and in edit mode with "Done". The top bar SHALL NOT show the song's title. The sign-in page SHALL show the site's name, linking to the home page, above its card instead.

#### Scenario: Going home from the editor
- **WHEN** a visitor on `/editor` clicks "Sheet Library" in the top bar
- **THEN** the home page opens

#### Scenario: Back to the library
- **WHEN** a signed-in person opens a sheet's address in a new tab and picks Back in the top bar
- **THEN** the library opens

#### Scenario: No title in the bar
- **WHEN** a signed-in person opens the sheet "Amazing Grace"
- **THEN** the top bar starts with Back, and neither "Sheet Library" nor "Amazing Grace" is in it

#### Scenario: Sign-in page
- **WHEN** a visitor opens the sign-in page
- **THEN** the page has no top bar, and "Sheet Library" above the sign-in card opens the home page

### Requirement: Account link in the top bar
The top bar on the home page and `/editor` SHALL show a "Sign in" link to the sign-in page when the visitor isn't signed in. When they are signed in, it SHALL show the first letter of their email, in upper case and in a circle, as a link named "Account" to their account page. The top bar on a sheet's pages SHALL show neither.

#### Scenario: Signed out
- **WHEN** a visitor who isn't signed in opens the home page
- **THEN** the top bar shows "Sign in", which opens the sign-in page

#### Scenario: Signed in
- **WHEN** ana@example.com, signed in, opens `/editor`
- **THEN** the top bar shows "A" as a link named "Account" to the account page, and no "Sign in"

#### Scenario: On a sheet
- **WHEN** ana@example.com, signed in, opens a sheet
- **THEN** the top bar shows no "Account" and no "Sign in"

## REMOVED Requirements

### Requirement: Play and Edit
**Reason**: The sheet opens to play, and editing is a mode of it rather than a second page of the same weight.
**Migration**: "Edit" in the play view's bar opens edit mode, and "Done" goes back to play, both with the key and the capo shown (see `play-page` and `sheet-page`).
