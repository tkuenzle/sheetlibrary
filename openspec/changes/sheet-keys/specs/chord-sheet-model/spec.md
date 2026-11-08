# Spec Delta

## ADDED Requirements

### Requirement: The sheet's key
Content MAY hold the sheet's key: a tonic, spelled as a chord's root is, and whether it is minor. Content without a key SHALL be stored without one, and its version SHALL still be 1. Checking a sheet SHALL report a key whose tonic isn't a note, or that doesn't say whether it is minor.

#### Scenario: Key stored
- **WHEN** a sheet in E minor is stored with its key
- **THEN** its content holds the tonic "E" and minor, and the content's version is still 1

#### Scenario: Key that isn't valid
- **WHEN** content with a key whose tonic is "H" is checked
- **THEN** a problem is reported for the key
