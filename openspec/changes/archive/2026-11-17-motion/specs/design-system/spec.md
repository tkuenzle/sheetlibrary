# Spec Delta

## ADDED Requirements

### Requirement: Still with reduced motion
When the system asks for reduced motion, nothing on any page SHALL move or fade. Panels, inputs and switches SHALL open, close and change at once. Signs that something is going on, such as the loading bar and the photo import's sign, SHALL stand still.

#### Scenario: Opening the navigation
- **WHEN** reduced motion is on and a visitor opens the full rail in a window 800px wide
- **THEN** the rail and the dimmed page show right away, without sliding or fading in

#### Scenario: Lyrics only
- **WHEN** reduced motion is on and a visitor turns on "Lyrics only" in View
- **THEN** the switch's handle is at its end right away
