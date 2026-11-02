# Spec Delta

## MODIFIED Requirements

### Requirement: Title and artist
A sheet SHALL have a title, which SHALL be text of at most 100 characters. A sheet MAY have an artist, the performer, which SHALL be text of at most 100 characters. A sheet without an artist SHALL be stored without one.

#### Scenario: No artist
- **WHEN** a sheet with the title "Amazing Grace" and no artist is stored
- **THEN** it holds the title and no artist

#### Scenario: Missing title
- **WHEN** a sheet without a title is checked
- **THEN** a problem is reported for the title

#### Scenario: Title too long
- **WHEN** a sheet with a title of 101 characters is checked
- **THEN** a problem is reported for the title
