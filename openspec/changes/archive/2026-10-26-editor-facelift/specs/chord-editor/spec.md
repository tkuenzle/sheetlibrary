# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: Docked toolbar on touch devices`
- TO: `### Requirement: Docked toolbar`

## MODIFIED Requirements

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

### Requirement: Pressing move again
With the toolbar beside the section, after a move, the page SHALL scroll so the move buttons stay where they were in the window. With the docked toolbar, the page SHALL keep the caret in view. Either way, the user SHALL be able to press again without looking for the button.

#### Scenario: Press again
- **WHEN** the active section is third of three and the user presses "move up" twice without moving the pointer or finger
- **THEN** the section is first

## ADDED Requirements

### Requirement: Section numbers
Each section SHALL show its number, counted from the top, in a round badge. The active section's badge SHALL stand out from the others. The badge SHALL sit left of the lyrics, also on a tablet with the toolbar docked. Only in a narrow window, as on a phone, SHALL it sit above them. Screen readers SHALL read it as "Section" and the number. It SHALL NOT take the caret and SHALL NOT change where chords sit over their letters.

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
