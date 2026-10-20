## ADDED Requirements

### Requirement: Piles and chords on spaces push the text
After a pile, the next letter SHALL start past the pile's last label. After a chord on a space, the next letter SHALL start past its label. A single chord on a letter that isn't a space SHALL NOT push the text after it, except to keep clear of the next chord.

#### Scenario: Pile
- **WHEN** "G7" and "C" sit on the "t" of "the"
- **THEN** the "h" starts after the "C" label

#### Scenario: Chord on a space
- **WHEN** "D" sits on the space between "Amazing" and "grace"
- **THEN** "grace" starts after the "D" label

### Requirement: Dash in a split word
When labels push two letters of one word apart, the gap SHALL show a dash and SHALL be at least 0.6em wide. This holds for a pile and for long labels on letters close to each other. A gap between two words SHALL NOT show a dash. The dash SHALL NOT be part of the text.

#### Scenario: Pile inside a word
- **WHEN** "G7" and "C" sit on the "t" of "the"
- **THEN** a dash shows between the "t" and the "h", and the line's text is still "the"

#### Scenario: Long labels on letters next to each other
- **WHEN** "Cmaj7" sits on the "t" of "the" and "Dsus4" on the "h"
- **THEN** a dash shows between the "t" and the "h"

#### Scenario: Short pile on a wide letter
- **WHEN** "I" and "V" sit on the "m" of "my"
- **THEN** the gap between the "m" and the "y" is at least 0.6em wide

### Requirement: Caret in a gap
A click or tap in a gap made by pushed text SHALL put the caret between the two letters. The caret SHALL show where typed text appears: at the end of a gap after a pile or a chord on a space, and at the start of a gap in front of a letter pushed by the labels before it.

#### Scenario: Click near the start of a gap
- **WHEN** "G7" and "C" sit on the "t" of "the" and the user clicks just after the "t"
- **THEN** the caret shows just before the "h", and typed text appears there

#### Scenario: Click in front of a pushed letter
- **WHEN** "Cmaj7" sits on the "t" of "the", "Dsus4" on the "h", and the user clicks just before the "h"
- **THEN** the caret shows just after the "t", and typed text appears there

### Requirement: Labels placed without delay
After a change, the labels and the pushed text SHALL be in place when the change first shows. The lyrics SHALL NOT jump afterwards.

#### Scenario: Chord added on a space
- **WHEN** the user adds a chord on the space before a word
- **THEN** the chord and the pushed word show in the same frame

## MODIFIED Requirements

### Requirement: Finishing a section
When the caret leaves a section, or editing ends, the section SHALL be cleaned up by the chord sheet model: empty lines are dropped, spaces are trimmed and collapsed as the model does, and a section left empty is removed. Escape and a click outside the sheet SHALL end editing. Opening the chord input SHALL NOT end editing.

#### Scenario: Empty line dropped
- **WHEN** a section has an empty line and the user clicks into another section
- **THEN** the empty line is gone

#### Scenario: Trailing space after a moved chord
- **WHEN** a chord sits after the last letter of a line, the user drags it onto a letter in the line, and then clicks into another section
- **THEN** the line ends with its last letter

#### Scenario: Double space collapsed
- **WHEN** the user types a second space between two words and clicks into another section
- **THEN** the words are separated by one space

#### Scenario: Emptied section removed
- **WHEN** the user deletes all text of a section and presses Escape
- **THEN** the section is gone

#### Scenario: Chord input
- **WHEN** a section has an empty line and the user opens the chord input with Ctrl+K or Cmd+K
- **THEN** the section is still active and keeps its empty line
