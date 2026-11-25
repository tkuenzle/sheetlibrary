# Spec Delta

## MODIFIED Requirements

### Requirement: Choose collections from a row
"Choose collections…" on a row SHALL open the same dialog as on the play view, for that sheet. The rail SHALL show the new counts after each change in the dialog.

#### Scenario: Adding from Sheets
- **WHEN** a person picks "Choose collections…" on the row "Stille Nacht" and ticks "Christmas"
- **THEN** the rail counts one more sheet in "Christmas", and after "Done" the page of "Christmas" lists "Stille Nacht"
