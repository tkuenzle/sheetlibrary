## ADDED Requirements

### Requirement: Pages known from the start
The app SHALL know every page an address can lead to from the first page load. A page change inside the app SHALL NOT wait to ask the server which page an address leads to.

#### Scenario: A sheet opened for the first time
- **WHEN** a person on `/sheets` opens a sheet they haven't opened in this session
- **THEN** the app asks the server only for the sheet's data, not which page its address leads to
