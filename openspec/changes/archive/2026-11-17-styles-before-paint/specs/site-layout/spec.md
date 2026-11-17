# Spec Delta

## ADDED Requirements

### Requirement: Styled from the first frame
After a move to another page without a full load, the new page SHALL show with its styles from the first frame it is painted. A move SHALL NOT add or remove any of the page's stylesheets, so moving back is the same.

#### Scenario: From Sheets to a collection and back
- **WHEN** a person on a phone, on `/sheets`, opens the collection "Christmas" and then goes back
- **THEN** both pages show styled in every frame, and no row shows as a bare underlined link
