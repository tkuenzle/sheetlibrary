# site-layout Specification

## Purpose

The frame shared by the site's pages: the top bar that names the site and leads back to the home page.

## Requirements

### Requirement: Top bar
The home page and the editor page SHALL show a top bar with the name "Sheet Library" as a link to the home page. The `/design` page SHALL NOT have it.

#### Scenario: Going home from the editor
- **WHEN** a visitor on `/editor` clicks "Sheet Library" in the top bar
- **THEN** the home page opens

### Requirement: Account link in the top bar
The top bar SHALL show a "Sign in" link to the sign-in page when the visitor isn't signed in. When they are signed in, it SHALL show a link to their account page instead.

#### Scenario: Signed out
- **WHEN** a visitor who isn't signed in opens the home page
- **THEN** the top bar shows "Sign in", which opens the sign-in page

#### Scenario: Signed in
- **WHEN** a signed-in person opens the home page
- **THEN** the top bar shows a link to their account page and no "Sign in"
