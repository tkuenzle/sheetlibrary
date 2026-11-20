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

## MODIFIED Requirements

### Requirement: A skeleton while a page loads
On a move inside the app to Sheets, a collection, a sheet or the account page, the new page SHALL show right after the tap and move in, without waiting for its data. Where data is still on its way, the page SHALL show bars inside the real row's frame, at the real row's height. When the data arrives, it SHALL take the bars' place without anything around it shifting. Data that arrives while the page still moves in SHALL show once the move has ended. A page loaded in full SHALL arrive with its data, without bars.

#### Scenario: A slow collection
- **WHEN** a person on `/sheets` selects "Christmas" in the rail, and its sheets take two seconds to arrive
- **THEN** the collection's page fades in right away with bars in place of the rows, and the rows show when they arrive

#### Scenario: Data during the move
- **WHEN** a person selects a row on `/sheets`, and the sheet arrives while it still rises
- **THEN** the sheet rises with bars in place of its lines, and the lines show when the rise has ended

#### Scenario: A first load
- **WHEN** a person opens `/collections/:id` in a new tab
- **THEN** the page arrives with its rows, without bars
