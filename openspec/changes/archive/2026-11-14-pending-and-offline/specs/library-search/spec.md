# Spec Delta

## ADDED Requirements

### Requirement: A search that doesn't go through
When a search can't be loaded, the page SHALL stay as it is: the field SHALL keep what was typed, and the last results SHALL stay listed. Below the field, a note SHALL say "Couldn’t search. Showing the last results." The note SHALL go once a search goes through.

#### Scenario: Offline while typing
- **WHEN** a person searched "o du", loses the connection and types on to "o du fr"
- **THEN** the field holds "o du fr", the results for "o du" stay listed, and the note says "Couldn’t search. Showing the last results."

#### Scenario: Back online
- **WHEN** the connection is back and the person types another letter
- **THEN** the results for the new search show and the note is gone
