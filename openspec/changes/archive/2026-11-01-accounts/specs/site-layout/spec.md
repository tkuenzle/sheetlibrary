# Spec Delta

## ADDED Requirements

### Requirement: Account link in the top bar
The top bar SHALL show a "Sign in" link to the sign-in page when the visitor isn't signed in. When they are signed in, it SHALL show a link to their account page instead.

#### Scenario: Signed out
- **WHEN** a visitor who isn't signed in opens the home page
- **THEN** the top bar shows "Sign in", which opens the sign-in page

#### Scenario: Signed in
- **WHEN** a signed-in person opens the home page
- **THEN** the top bar shows a link to their account page and no "Sign in"
