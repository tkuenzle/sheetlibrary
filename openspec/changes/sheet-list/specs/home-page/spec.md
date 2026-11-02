# Spec Delta

## ADDED Requirements

### Requirement: Signed-in people go to the library
A signed-in person who opens `/` SHALL be sent to the library at `/sheets`. A visitor who isn't signed in SHALL see the home page.

#### Scenario: Signed in
- **WHEN** a signed-in person opens `/`
- **THEN** the library opens
