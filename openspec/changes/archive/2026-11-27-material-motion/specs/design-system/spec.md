# Spec Delta

## MODIFIED Requirements

### Requirement: Bottom sheets slide from the bottom
On a phone, a dialog that shows as a sheet at the bottom of the screen, such as photo import, SHALL slide up from the bottom edge over a scrim that fades in, and slide back down when it closes, faster than it came in. A sheet that nearly fills the screen, such as photo import, SHALL take longer both ways than a smaller one, such as the key panel.

#### Scenario: Photo import on a phone
- **WHEN** a person on a phone picks "From photos…"
- **THEN** "Import from photos" slides up from the bottom while the page dims

#### Scenario: A large sheet takes longer
- **WHEN** a person on a phone opens the key panel, closes it, and then opens "Import from photos"
- **THEN** "Import from photos" takes longer to slide up than the key panel did
