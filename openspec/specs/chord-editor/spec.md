# chord-editor Specification

## Purpose

Lets musicians edit a chord sheet visually, one section at a time: chords appear above the lyrics, are added and edited by keyboard or by clicking them, and stay on their letters while the lyrics change.

## Requirements

### Requirement: Chords above their letters
The editor SHALL show each chord above the letter it belongs to. A chord wider than the lyrics under it SHALL NOT overlap the next chord; the lyrics are pushed apart instead.

#### Scenario: Wide chord
- **WHEN** "Cmaj7" sits on a letter and the next chord sits two letters later
- **THEN** both chords can be read and the lyrics between them are spread out

#### Scenario: Long line wraps
- **WHEN** a line is too long for the screen and wraps
- **THEN** every chord stays above its letter on the wrapped part

### Requirement: Adding and editing chords
The user SHALL be able to add a chord at the caret, and to edit and remove a chord, by keyboard. Clicking or tapping a chord's label SHALL open it for editing. Any chord text is accepted. The chord input SHALL have the buttons "Done" and "Cancel", and "Remove" when it edits a chord.

#### Scenario: Add by keyboard
- **WHEN** the caret is just before the "r" in "wretch" and the user presses Ctrl+K or Cmd+K and enters "Am"
- **THEN** "Am" appears above the "r"

#### Scenario: Delete a chord
- **WHEN** the user opens a chord and presses "Remove"
- **THEN** the chord is gone and the lyrics are unchanged

#### Scenario: Buttons for a new chord
- **WHEN** the user opens the chord input to add a chord
- **THEN** it shows "Done" and "Cancel", and no "Remove"

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

### Requirement: Editing a sheet
The editor SHALL edit all sections of a chord sheet in one place. It SHALL show the sections, lines and chords as stored, and hand back the same sheet when nothing was changed.

#### Scenario: Unchanged sheet
- **WHEN** a sheet with two sections, one ending with a chord after its last letter, is loaded and handed back without changes
- **THEN** the sheet has the same sections, text and chords as before

### Requirement: Active section
The section with the caret SHALL be the active section and SHALL look active. The other sections SHALL look dimmed but stay editable: moving the caret into one, by click or arrow key, makes it active. Only the active section's chord labels SHALL open for editing; a click on another label makes its section active. A selection SHALL stay inside one section.

#### Scenario: Arrow into the next section
- **WHEN** the caret is on the last line of the first section and the user presses the down arrow key
- **THEN** the caret is in the second section, and the second section is active

#### Scenario: Chord in another section
- **WHEN** the first section is active and the user clicks a chord label in the second section
- **THEN** the second section is active and no chord is opened for editing

#### Scenario: Selection across sections
- **WHEN** the user drags a selection from the first section into the second
- **THEN** the selection ends at the end of the first section

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

### Requirement: Blank line is a section break
Enter on an empty line SHALL split the section there: the empty line goes, and the lines after it start a new section with the caret. Pasted text with blank lines SHALL become one section per block of lines.

#### Scenario: Enter on an empty line
- **WHEN** the caret is at the end of the second of four lines and the user presses Enter twice
- **THEN** the section holds the first two lines, a new section holds the other two, and the caret is at the start of the new section

#### Scenario: Paste with blank lines
- **WHEN** the user pastes "a\nb\n\nc" into an empty sheet
- **THEN** the sheet has two sections: "a" and "b", then "c"

### Requirement: Joining sections
Backspace at the start of a section SHALL join it with the section before: its lines are added after that section's lines, and no lines are merged.

#### Scenario: Backspace at the start
- **WHEN** the caret is at the start of the second section and the user presses Backspace
- **THEN** the lines of both sections form one section, and the caret stays where it was

### Requirement: Undo across sections
Undo SHALL undo edits in any section, newest first, and make the section of the undone edit active. One undo SHALL bring back a section that clean-up removed, together with its text.

#### Scenario: Edits in two sections
- **WHEN** the user types in the first section, then in the second, and presses undo twice
- **THEN** both edits are undone and the first section is active

#### Scenario: Removed section
- **WHEN** the user deletes all text of a section, clicks into another section, and presses undo once
- **THEN** the section is back with its text

### Requirement: Handing back a sheet
The editor SHALL hand back the whole sheet, with every section cleaned up and the result checked by the chord sheet model, including the active section.

#### Scenario: Active section with an empty line
- **WHEN** the active section has an empty line and the sheet is handed back
- **THEN** the handed-back section holds no empty line

#### Scenario: Nothing left
- **WHEN** the user deletes all text in every section and the sheet is handed back
- **THEN** the handed-back sheet has no sections

### Requirement: Moving chords by dragging
The user SHALL be able to drag a chord's label onto another letter to move the chord there. While dragging, a caret SHALL show where the chord will land. The chord SHALL go after any chords already on that letter. A tap or click without moving SHALL still open the chord for editing. A move SHALL be one undo step and SHALL NOT move the text caret. Escape SHALL cancel a drag. Starting a drag SHALL close the chord input without saving it. Only one chord SHALL be dragged at a time.

#### Scenario: Drag onto a letter
- **WHEN** the user drags "Cmaj7" onto the "t" of "to"
- **THEN** "Cmaj7" sits on the "t", and one undo puts it back

#### Scenario: Escape
- **WHEN** the user is dragging a chord and presses Escape
- **THEN** the chord stays where it was

#### Scenario: Chord input open
- **WHEN** the chord input is open with unsaved text and the user drags a chord onto a letter
- **THEN** the chord input is closed, its text is not saved, and the chord sits on the letter

### Requirement: Dragging stays in the active section
Only the active section's chords SHALL be draggable, and a dragged chord SHALL only land in the active section. Over any other place the caret SHALL hide, and letting go SHALL leave the chord where it was.

#### Scenario: Drop on another section
- **WHEN** the user drags a chord from the active section onto a letter in another section and lets go
- **THEN** the chord stays where it was, and the other section does not become active

### Requirement: Dropping into a pile
When a chord is dragged over the labels of a pile, the caret SHALL show between the labels, and the chord SHALL land at that spot in the pile. This SHALL work for a chord from the same pile, which reorders the pile.

#### Scenario: Reorder a pile
- **WHEN** "G C Em" sit on one letter and the user drags "Em" between "G" and "C"
- **THEN** the letter holds "G Em C", in that order

#### Scenario: Drop into a pile
- **WHEN** "G C" sit on one letter and the user drags "D" from another letter between them
- **THEN** the letter holds "G D C"

### Requirement: Scrolling while dragging
While a chord is dragged near the top or bottom edge of the window, the page SHALL scroll in that direction, and the caret SHALL follow the chord. On a touch drag, the page SHALL scroll up when the lifted label gets near the top edge, and down when the finger gets near the bottom edge.

#### Scenario: Drag to a line out of view
- **WHEN** the active section is taller than the window and the user drags a chord to the bottom edge
- **THEN** the page scrolls until the user stops at a line, and the chord lands there

#### Scenario: Touch drag up
- **WHEN** the page is scrolled down and the user drags a chord with a finger until its label is near the top edge
- **THEN** the page scrolls up, although the finger is not near the top edge

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

### Requirement: Labels in place after the font loads
When a font loads after the editor is shown, the labels and the pushed text SHALL be placed again for the new font, so every chord stays over its letter.

#### Scenario: Font arrives late
- **WHEN** the editor is shown with a fallback font and the lyrics font then finishes loading
- **THEN** every chord label sits over its letter in the new font

### Requirement: Lifting the label on touch
When a chord is dragged with a finger, its label SHALL lift above the finger, far enough that the label and the drop caret under it are both above the finger. The label SHALL slide up when the drag starts. The chord SHALL land on the letter under the label, not under the finger. Dragging with a mouse or a pen SHALL NOT lift the label.

#### Scenario: Touch drag
- **WHEN** the user drags "Cmaj7" with a finger
- **THEN** the label and the drop caret show above the finger, and letting go puts "Cmaj7" on the letter under the label

#### Scenario: Mouse drag
- **WHEN** the user drags "Cmaj7" with a mouse
- **THEN** the label stays under the pointer

### Requirement: Adding chords by mouse
When the mouse is in the band below the lyrics of the active section, a caret SHALL show in front of the letter at the pointer, in the lyrics, with a "+" under it. Spaces and the end of a line count as spots. A click there SHALL open the chord input for that letter, and the chord entered SHALL go after any chords already on it. Adding SHALL be one undo step, SHALL NOT move the text caret, and SHALL NOT end editing.

#### Scenario: Add on a letter
- **WHEN** the user clicks below the "r" in "wretch" and enters "Am"
- **THEN** "Am" sits on the "r", the text caret is where it was, and one undo removes "Am"

#### Scenario: Add to a pile
- **WHEN** "G" sits on the "t" of "the" and the user clicks below the "t" and enters "C"
- **THEN** the "t" holds "G C", in that order

#### Scenario: Add at the end of a line
- **WHEN** the user clicks below the line, past its last letter, and enters "D"
- **THEN** "D" sits after the last letter

### Requirement: Where the "+" shows
The "+" SHALL only show below the lyrics of the active section. Over the lyrics, a click SHALL place the text caret as before.

#### Scenario: Another section
- **WHEN** the first section is active and the mouse is below the lyrics of the second section
- **THEN** no "+" shows

#### Scenario: Click on the lyrics
- **WHEN** the user clicks on a letter of the active section
- **THEN** the text caret moves there and the chord input does not open

### Requirement: Section toolbar
The active section SHALL have a toolbar with "Add chord", "Move section up" and "Move section down" buttons, each at least 44px tall. Other sections SHALL NOT have one. Not docked, it SHALL sit left of the active section, level with its top, and stay in the window while the section scrolls, but never below the section. With a mouse, each button SHALL show its name in a tooltip. Pressing a button SHALL NOT take focus from the editor.

#### Scenario: Mouse
- **WHEN** the user clicks into the second section on a wide desktop window and points at the first
- **THEN** the toolbar shows left of the second section only

#### Scenario: Tooltip
- **WHEN** the mouse rests on the toolbar's first button
- **THEN** a tooltip says "Add chord"

#### Scenario: Tall section
- **WHEN** the active section is taller than the window and the user scrolls to its last line
- **THEN** the toolbar is in the window, next to the section

### Requirement: Docked toolbar
On a device whose main pointer is a finger, or in a window too narrow for the margin beside the section, the section toolbar SHALL be docked at the bottom of the visible area, above the keyboard when it is open. It SHALL NOT cover the caret. Docked, its move buttons SHALL sit next to the word "Move", so they don't read as a way to step through the sections.

#### Scenario: Touch
- **WHEN** the user taps a letter in the second of two sections on a phone
- **THEN** the toolbar shows "Move" and the move buttons at the bottom of the visible area, and the caret's line is above it

#### Scenario: Narrow window
- **WHEN** the user clicks into a section with a mouse in a window too narrow for the margin
- **THEN** the toolbar is docked at the bottom of the window

### Requirement: Adding a chord from the toolbar
Pressing "Add chord" SHALL open the chord input for the letter after the caret, and the chord entered SHALL go after any chords already on it. With a selection, the caret's end of it counts. Adding SHALL be one undo step and SHALL NOT move the text caret.

#### Scenario: Add on a letter
- **WHEN** the caret is just before the "r" in "wretch", the user presses "Add chord" and enters "Am"
- **THEN** "Am" sits on the "r", the text caret is where it was, and one undo removes "Am"

#### Scenario: Add to a pile
- **WHEN** "G" sits on the "t" of "the", the caret is just before the "t", and the user presses "Add chord" and enters "C"
- **THEN** the "t" holds "G C", in that order

### Requirement: Moving a section
Pressing "move up" or "move down" SHALL swap the active section with the one before or after it. The moved section SHALL stay active, with the caret at the same spot in its text, and SHALL NOT be cleaned up. A move SHALL be one undo step, and undo SHALL make the moved section active. In the first section, "move up" SHALL be disabled; in the last, "move down" SHALL be disabled. A sheet with a single section SHALL NOT show them.

#### Scenario: Move up
- **WHEN** the caret is after "Was" in the second of three sections and the user presses "move up"
- **THEN** that section is first, it is still active, and the caret is still after "Was"

#### Scenario: Undo
- **WHEN** the user moves a section up and then presses undo
- **THEN** the section is back in its place and active

#### Scenario: First section
- **WHEN** the first section is active
- **THEN** "move up" is disabled and "move down" can be pressed

### Requirement: Pressing move again
With the toolbar beside the section, after a move, the page SHALL scroll so the move buttons stay where they were in the window. With the docked toolbar, the page SHALL keep the caret in view. Either way, the user SHALL be able to press again without looking for the button.

#### Scenario: Press again
- **WHEN** the active section is third of three and the user presses "move up" twice without moving the pointer or finger
- **THEN** the section is first

### Requirement: Section numbers
Each section SHALL show its number, counted from the top, in a round badge. The active section's badge SHALL stand out from the others. The badge SHALL sit left of the lyrics, also on a tablet with the toolbar docked. Only in a narrow window, as on a phone, SHALL it sit above them. Screen readers SHALL read it as the word the app sets, "Section", and the number, or only the number in a browser that can't put a counter in the alternative text. It SHALL NOT take the caret and SHALL NOT change where chords sit over their letters.

#### Scenario: After a move
- **WHEN** the second of three sections is moved up
- **THEN** it shows "1", and the section it swapped with shows "2"

#### Scenario: Tablet
- **WHEN** the user edits a section on a tablet
- **THEN** the toolbar is docked, and each badge sits left of its section's lyrics

#### Scenario: Phone
- **WHEN** the user edits a section on a phone
- **THEN** each badge sits above its section's lyrics

#### Scenario: Screen reader
- **WHEN** a screen reader reads the second section
- **THEN** it starts with "Section 2"

#### Scenario: Caret at a section's start
- **WHEN** the user presses the left arrow key at the start of a section's first line
- **THEN** the caret goes to the end of the section before, not onto the badge

### Requirement: Reduced motion
When the user's system asks for reduced motion, the editor SHALL NOT animate: a label dragged by touch SHALL lift at once, and the docked toolbar SHALL show again at once after hiding.

#### Scenario: Touch drag with reduced motion
- **WHEN** reduced motion is on and the user starts dragging a chord with a finger
- **THEN** the label is above the finger right away, without sliding

### Requirement: Visible in forced colors
In forced colors mode, such as Windows high contrast, the active section and the selected chord label SHALL keep an outline, so they can still be told apart from the others.

#### Scenario: Selected chord in high contrast
- **WHEN** forced colors are on and the user opens a chord for editing
- **THEN** its label has an outline and the other labels don't
