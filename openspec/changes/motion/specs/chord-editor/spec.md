# Spec Delta

## MODIFIED Requirements

### Requirement: Active section
The section with the caret SHALL be the active section and SHALL look active. The other sections SHALL look dimmed but stay editable: moving the caret into one, by click or arrow key, makes it active. Only the active section's chord labels SHALL open for editing; a click on another label makes its section active. A selection SHALL stay inside one section. A section that becomes active, or stops being active, SHALL fade between the two looks. The fade SHALL change only colors, never a size or a position.

#### Scenario: Arrow into the next section
- **WHEN** the caret is on the last line of the first section and the user presses the down arrow key
- **THEN** the caret is in the second section, and the second section is active

#### Scenario: Chord in another section
- **WHEN** the first section is active and the user clicks a chord label in the second section
- **THEN** the second section is active and no chord is opened for editing

#### Scenario: Selection across sections
- **WHEN** the user drags a selection from the first section into the second
- **THEN** the selection ends at the end of the first section

#### Scenario: Fading into the next section
- **WHEN** the user clicks into the second section
- **THEN** the second section's colors fade from dimmed to active, and the first section's from active to dimmed

### Requirement: Reduced motion
When the user's system asks for reduced motion, the editor SHALL NOT animate: a label dragged by touch SHALL lift at once, the docked toolbar SHALL show again at once after hiding, the docked chord input SHALL open and close at once, and a section SHALL look active or dimmed at once.

#### Scenario: Touch drag with reduced motion
- **WHEN** reduced motion is on and the user starts dragging a chord with a finger
- **THEN** the label is above the finger right away, without sliding

#### Scenario: Docked chord input with reduced motion
- **WHEN** reduced motion is on and the user opens the chord input on a phone and presses Cancel
- **THEN** the input shows right away, without sliding, and is gone right away

#### Scenario: Active section with reduced motion
- **WHEN** reduced motion is on and the user clicks into the second section
- **THEN** the second section looks active right away
