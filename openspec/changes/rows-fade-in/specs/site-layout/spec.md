# Spec Delta

## ADDED Requirements

### Requirement: Data fades in where the bars were
When a page's data arrives after its bars showed, what takes the bars' place SHALL fade in, in a short fade. What already showed for real, such as the heading, the top bar and the search field, SHALL stay as it is. Taps and typing SHALL work while it fades. The fade SHALL play only for the first data after the bars: rows that show later, such as new search results, SHALL show at once.

#### Scenario: A slow collection
- **WHEN** a person selects "Christmas" in the rail, and its sheets take two seconds to arrive
- **THEN** the rows fade in where the bars were, and "Christmas" and "3 sheets" stay as they are

#### Scenario: Back to Sheets
- **WHEN** a person steps back from a sheet to `/sheets`, and the fresh data takes two seconds to arrive
- **THEN** Recent's cards fade in where Recent's bars were, and the list stays as it is

#### Scenario: A search after the fade
- **WHEN** a person on `/sheets`, whose rows faded in, searches for "nacht"
- **THEN** the results show at once, without a fade

### Requirement: Dialog lists fade in where the bars were
When the list in "Add sheets" or "Choose collections" arrives after its bars were seen, it SHALL fade in, as a page's data does. A list that arrives while its bars are still unseen SHALL show at once.

#### Scenario: A slow list
- **WHEN** a person picks "Choose collections…" in a row's menu, and the collections take a second to arrive
- **THEN** the collections fade in where the bars were

#### Scenario: A quick list
- **WHEN** a person picks "Choose collections…" in a row's menu, and the collections arrive after 50ms
- **THEN** the collections show at once, without bars or a fade
