# Spec Delta

## MODIFIED Requirements

### Requirement: Search field
A person with sheets SHALL see a search field below the heading on `/sheets`. The other screens SHALL NOT have one. A search SHALL find their sheets whose title, artist or lyrics hold every word typed, and no one else's. Without sheets, the field SHALL NOT show.

#### Scenario: Finding by lyrics
- **WHEN** a person has "Amazing Grace", whose lyrics hold "how sweet the sound", and "Hallelujah", and searches "sweet sound"
- **THEN** the library lists "Amazing Grace" and not "Hallelujah"

#### Scenario: Someone else's sheets
- **WHEN** another person has a sheet "Shenandoah", and this person searches "shenandoah"
- **THEN** no sheet is found

#### Scenario: On Collections
- **WHEN** a person with sheets opens `/collections`
- **THEN** the page has no search field
