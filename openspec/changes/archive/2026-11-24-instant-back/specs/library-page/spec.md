## ADDED Requirements

### Requirement: Recent's cards have one height
Every card in "Recent" SHALL have the same height, with room for two lines of title, the artist and the key, whether the sheet has them or not. Its bars, while "Recent" loads, SHALL take the same room.

#### Scenario: Cards of one height
- **WHEN** "Recent" shows "Amazing Grace" with an artist and a key, and a sheet with a short title and neither
- **THEN** both cards have the same height, and so do the bars that stand for them
