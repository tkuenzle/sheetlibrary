# Spec Delta

## ADDED Requirements

### Requirement: Labels in place after the font loads
When a font loads after the editor is shown, the labels and the pushed text SHALL be placed again for the new font, so every chord stays over its letter.

#### Scenario: Font arrives late
- **WHEN** the editor is shown with a fallback font and the lyrics font then finishes loading
- **THEN** every chord label sits over its letter in the new font
