# Spec Delta

## MODIFIED Requirements

### Requirement: Top bar
Every page except the sign-in page and the `/design` page SHALL show a top bar. It SHALL start with the name "Sheet Library" as a link to the home page, or to the library at `/sheets` once the visitor is signed in. On a sheet, at `/sheets/:id` or `/sheets/:id/edit`, it SHALL start with "Library" and a back arrow instead, as a link to the library. On a collection, at `/collections/:id`, it SHALL start with "Collections" and a back arrow, as a link to `/collections`. The top bar SHALL NOT show the song's title. The sign-in page SHALL show the site's name, linking to the home page, above its card instead.

#### Scenario: Going home from the editor
- **WHEN** a visitor on `/editor` clicks "Sheet Library" in the top bar
- **THEN** the home page opens

#### Scenario: Back to the library
- **WHEN** a signed-in person on a sheet clicks "Library" in the top bar
- **THEN** the library opens

#### Scenario: Back to the collections
- **WHEN** a signed-in person on the page of "Christmas" clicks "Collections" in the top bar
- **THEN** the Collections tab opens

#### Scenario: No title in the bar
- **WHEN** a signed-in person opens the sheet "Amazing Grace"
- **THEN** the top bar starts with "Library", and neither "Sheet Library" nor "Amazing Grace" is in it

#### Scenario: Sign-in page
- **WHEN** a visitor opens the sign-in page
- **THEN** the page has no top bar, and "Sheet Library" above the sign-in card opens the home page
