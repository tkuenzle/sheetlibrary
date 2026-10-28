# Spec Delta

## MODIFIED Requirements

### Requirement: Text belongs to the app
The `chord-editor` package SHALL hold no UI text. Any word it shows or has read out SHALL come from the app.

#### Scenario: Package without the app's words
- **WHEN** the package is used without the app setting its words for labels
- **THEN** an active section without a label shows no "Add label" text
