# Spec Delta

## ADDED Requirements

### Requirement: Every page change moves
A change from one page to another SHALL move by the kind of its two pages, whether a link, a button or the page itself starts it. A change that keeps the page and changes only its address, such as a search, a key or a capo, SHALL NOT move.

#### Scenario: A new sheet
- **WHEN** a person on `/sheets` picks "New sheet" and then "Write a new sheet"
- **THEN** the new sheet's edit mode rises over the list

#### Scenario: A search
- **WHEN** a person on `/sheets` types "grace" in the search field
- **THEN** the results show without a move

### Requirement: Data during a move
Data that arrives while a page still moves in SHALL show once the move has ended, in place of the skeleton's bars.

#### Scenario: Data during the move
- **WHEN** a person selects a row on `/sheets`, and the sheet arrives while it still rises
- **THEN** the sheet rises with bars in place of its lines, and the lines show when the rise has ended
