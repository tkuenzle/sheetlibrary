## ADDED Requirements

### Requirement: Lifting the label on touch
When a chord is dragged with a finger, its label SHALL lift above the finger, far enough that the label and the drop caret under it are both above the finger. The label SHALL slide up when the drag starts. The chord SHALL land on the letter under the label, not under the finger. Dragging with a mouse or a pen SHALL NOT lift the label.

#### Scenario: Touch drag
- **WHEN** the user drags "Cmaj7" with a finger
- **THEN** the label and the drop caret show above the finger, and letting go puts "Cmaj7" on the letter under the label

#### Scenario: Mouse drag
- **WHEN** the user drags "Cmaj7" with a mouse
- **THEN** the label stays under the pointer

## MODIFIED Requirements

### Requirement: Scrolling while dragging
While a chord is dragged near the top or bottom edge of the window, the page SHALL scroll in that direction, and the caret SHALL follow the chord. On a touch drag, the page SHALL scroll up when the lifted label gets near the top edge, and down when the finger gets near the bottom edge.

#### Scenario: Drag to a line out of view
- **WHEN** the active section is taller than the window and the user drags a chord to the bottom edge
- **THEN** the page scrolls until the user stops at a line, and the chord lands there

#### Scenario: Touch drag up
- **WHEN** the page is scrolled down and the user drags a chord with a finger until its label is near the top edge
- **THEN** the page scrolls up, although the finger is not near the top edge
