# Spec Delta

## MODIFIED Requirements

### Requirement: A row in the list
Each row SHALL show the sheet's title, its artist if it has one, and its key, as the `transposition` capability says: the key that was set, or else the one guessed from the chords. A guessed key SHALL look the same as a set one. A sheet without chords SHALL show no key. A row SHALL NOT show when the sheet was last edited. A row SHALL open the sheet to play at `/sheets/:id`. Sheets and a collection SHALL show the same rows.

#### Scenario: The same row in a collection
- **WHEN** "Stille Nacht" by Franz Xaver Gruber, in C, is in "Christmas"
- **THEN** its row on `/sheets` and on the page of "Christmas" both show "Stille Nacht", "Franz Xaver Gruber" and "C"

#### Scenario: A guessed key
- **WHEN** "Amazing Grace" has no key set and its chords are G, C and D
- **THEN** its row shows "G"

#### Scenario: No chords
- **WHEN** "Untitled" has lyrics but no chords
- **THEN** its row shows its title and no key
