## ADDED Requirements

### Requirement: Marked chords
The chord input SHALL read a chord in round brackets, such as `(C)`, as a held chord, and a chord in square brackets, such as `[C]`, as an optional chord. The text inside SHALL be read as any other chord, and spaces around it SHALL be ignored. A marked chord's label, and the input when it opens the chord, SHALL show the chord's canonical form inside the same brackets. Brackets that don't match SHALL be refused like other text that isn't a chord.

#### Scenario: Held chord
- **WHEN** the user enters "(Bb-7)" and presses "Done"
- **THEN** "(Bbm7)" appears above the letter, and opening it again shows "(Bbm7)" in the input

#### Scenario: Optional chord
- **WHEN** the user enters "[ G7 ]" and presses "Done"
- **THEN** "[G7]" appears above the letter

#### Scenario: Brackets that don't match
- **WHEN** the user enters "(C]" and presses "Done"
- **THEN** the input stays open with a note, and no chord is added
