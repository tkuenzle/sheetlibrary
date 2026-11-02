# Spec Delta

## MODIFIED Requirements

### Requirement: Top bar
The home page and the editor page SHALL show a top bar with the name "Sheet Library" as a link to the home page. Once the visitor is signed in, the name SHALL link to the library at `/sheets` instead. The `/design` page SHALL NOT have it.

#### Scenario: Going home from the editor
- **WHEN** a visitor on `/editor` clicks "Sheet Library" in the top bar
- **THEN** the home page opens

#### Scenario: Back to the library
- **WHEN** a signed-in person on a sheet clicks "Sheet Library" in the top bar
- **THEN** the library opens
