# Spec Delta

## MODIFIED Requirements

### Requirement: Choose collections
"Choose collections…" SHALL open a dialog that lists the owner's collections A to Z, each with a tick box, ticked for the collections that hold the sheet. On the play view and in edit mode, the dialog SHALL open with the list and its ticks at once. Ticking SHALL add the sheet to that collection at once, and unticking SHALL take it out at once. "Done" or Escape SHALL close the dialog.

#### Scenario: Adding to a collection
- **WHEN** the owner opens "Choose collections…" on "Stille Nacht", ticks "Christmas" and selects "Done"
- **THEN** the page of "Christmas" lists "Stille Nacht"

#### Scenario: Already in a collection
- **WHEN** the owner opens "Choose collections…" on a sheet in "Kinderlieder"
- **THEN** "Kinderlieder" shows ticked

#### Scenario: In edit mode
- **WHEN** the owner opens "Choose collections…" in edit mode on a sheet in "Kinderlieder"
- **THEN** the dialog opens with "Kinderlieder" ticked, without waiting for the list
