# Spec Delta

## MODIFIED Requirements

### Requirement: Top bar
Every page except the sign-in page and the `/design` page SHALL show a top bar. It SHALL start with the name "Sheet Library" as a link to the home page, or to the library at `/sheets` once the visitor is signed in. On a sheet, at `/sheets/:id` or `/sheets/:id/edit`, it SHALL start with "Library" and a back arrow instead, as a link to the library. The top bar SHALL NOT show the song's title. The sign-in page SHALL show the site's name, linking to the home page, above its card instead.

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

## ADDED Requirements

### Requirement: Play and Edit
On a sheet's two pages, the top bar SHALL show "Play" and "Edit" after "Library", as one switch with the current page marked. "Play" SHALL open `/sheets/:id` and "Edit" `/sheets/:id/edit`, each with the key and the capo shown now. On a phone, the switch SHALL show only their icons, still named "Play" and "Edit".

#### Scenario: From playing to editing
- **WHEN** the owner shows a sheet in A with capo 2 on the play view and picks "Edit"
- **THEN** the editor opens with the sheet in A and capo 2, and "Edit" is marked

#### Scenario: Back to playing
- **WHEN** the owner picks "Play" in the editor after their edits are saved
- **THEN** the play view opens with the edits
