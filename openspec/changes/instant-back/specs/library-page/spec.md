## MODIFIED Requirements

### Requirement: Recent sheets
Sheets SHALL show a "Recent" row between the search field and the list, with the 4 sheets the person opened last, the last opened first. Each SHALL show as a card with its title, its artist if it has one, and its key as the list shows it. Every card SHALL have the same height, with room for two lines of title, the artist and the key, whether the sheet has them or not. A card SHALL open the sheet to play, and SHALL have no menu. Deleting a sheet from its row SHALL take its card away at once, with the row. On a phone, the cards SHALL be a row that scrolls sideways.

#### Scenario: Opened last
- **WHEN** a person opens "Amazing Grace", then "Stille Nacht", and goes back to Sheets
- **THEN** "Recent" shows "Stille Nacht" first, then "Amazing Grace"

#### Scenario: More than 4 opened
- **WHEN** a person has opened 6 sheets
- **THEN** "Recent" shows the 4 opened last

#### Scenario: Deleting a recent sheet
- **WHEN** a person deletes "Stille Nacht" from its row while it is in "Recent"
- **THEN** its row and its card go away at once

#### Scenario: Cards of one height
- **WHEN** "Recent" shows "Amazing Grace" with an artist and a key, and a sheet with a short title and neither
- **THEN** both cards have the same height, and so do the bars that stand for them
