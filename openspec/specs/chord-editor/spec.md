# chord-editor Specification

## Purpose

Lets musicians edit a chord sheet visually: chords appear above the lyrics, are placed by click, tap or keyboard, and stay on their letters while the lyrics change.

## Requirements

### Requirement: Chords above their letters
The editor SHALL show each chord above the letter it belongs to. A chord wider than the lyrics under it SHALL NOT overlap the next chord; the lyrics are pushed apart instead.

#### Scenario: Wide chord
- **WHEN** "Cmaj7" sits on a letter and the next chord sits two letters later
- **THEN** both chords can be read and the lyrics between them are spread out

#### Scenario: Long line wraps
- **WHEN** a line is too long for the screen and wraps
- **THEN** every chord stays above its letter on the wrapped part

### Requirement: Placing chords
The user SHALL be able to place a chord on a letter by mouse, by keyboard and by touch, and to edit, move and delete a chord. Any chord text is accepted.

#### Scenario: Place by tap
- **WHEN** the user taps a letter and enters "G"
- **THEN** "G" appears above that letter

#### Scenario: Delete a chord
- **WHEN** the user deletes a chord with the chord controls
- **THEN** the chord is gone and the lyrics are unchanged

### Requirement: Natural caret
Chords SHALL NOT add caret stops. Each arrow key press moves the caret by one letter, and typing never changes a chord's text.

#### Scenario: Arrow past a chord
- **WHEN** the caret is just before a letter with a chord and the user presses the right arrow key once
- **THEN** the caret is just after that letter

### Requirement: Chords stay on their letters
A chord SHALL stay on its letter when text before it is added or removed, and when its line is split or joined with another line.

#### Scenario: Text added before a chord
- **WHEN** "D" sits on the "A" of "Amazing" and the user types "So " before it
- **THEN** "D" still sits on the "A"

#### Scenario: Line split
- **WHEN** the user presses Enter before a word that carries a chord
- **THEN** the word and its chord move to the new line together

### Requirement: Chords are rescued
When the letter under a chord is deleted or replaced, the chord SHALL move to the nearest remaining letter, which is the start of the replacement if there is one. A chord is never removed by editing the lyrics, except when its whole line is deleted.

#### Scenario: Letter replaced
- **WHEN** "D" sits on the "a" of "grace" and the user selects "ace" and types "ound"
- **THEN** "D" sits on the "o" of "ground"

#### Scenario: Letter deleted
- **WHEN** "D" sits on the "a" of "Amazing" and the user deletes that "a"
- **THEN** "D" sits on the "z"

### Requirement: Several chords on one letter
When rescued chords land on the same letter, the editor SHALL keep all of them in their original order and show them side by side.

#### Scenario: Range deleted
- **WHEN** "C", "D" and "Em" sit on three words and the user deletes those words
- **THEN** "C D Em" sits on the next remaining letter, in that order

### Requirement: Deleting whole lines
When a whole line is deleted, its chords SHALL be deleted with it. A line counts as deleted only when it is gone completely; replacing all of its text keeps its chords.

#### Scenario: Line deleted
- **WHEN** the user selects a full line, including its line break, and deletes it
- **THEN** its chords are gone and no other line gets them

#### Scenario: Line text replaced
- **WHEN** the user selects all text of a line, but not its line break, and types new words
- **THEN** all of the line's chords sit on the first new letter, in order

### Requirement: Undo restores chords
Undo SHALL restore lyrics and chords to the state before the edit in one step. Redo SHALL repeat the edit, including any chord rescue.

#### Scenario: Undo a deletion
- **WHEN** the user deletes a letter that carries a chord and then presses undo once
- **THEN** the letter is back and the chord sits on it again
