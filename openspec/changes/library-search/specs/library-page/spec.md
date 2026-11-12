# Spec Delta

## MODIFIED Requirements

### Requirement: My sheets
The page at `/sheets` SHALL list the signed-in person's sheets and no one else's. Without a search, it SHALL list all of them, the most recently edited first; while searching, it SHALL list only the results, as the `library-search` capability says. Each row SHALL show the sheet's title, its artist if it has one, and when it was last edited. A row SHALL open the sheet to play at `/sheets/:id`.

#### Scenario: Newest edit first
- **WHEN** a person has the sheets "Amazing Grace" and "Hallelujah", and last edited "Hallelujah"
- **THEN** the library lists "Hallelujah" first, then "Amazing Grace"

#### Scenario: Someone else's sheets
- **WHEN** another person has a sheet "Shenandoah"
- **THEN** it doesn't appear in this person's library

#### Scenario: Opening a sheet
- **WHEN** a person selects the row "Amazing Grace"
- **THEN** the play view of "Amazing Grace" opens, not the editor

#### Scenario: While searching
- **WHEN** a person has "Amazing Grace" and "Hallelujah", and searches "grace"
- **THEN** the library lists only "Amazing Grace"
