# Spec Delta

## MODIFIED Requirements

### Requirement: A collection's sheets
The page at `/collections/:id` SHALL show the collection's name as the heading and in the browser tab, how many sheets it holds, such as "14 sheets" or "1 sheet", and its sheets in the order the `sheet-list` capability says. Its rows and their menus SHALL be those of the `sheet-list` capability.

#### Scenario: A to Z
- **WHEN** "Christmas" holds "Stille Nacht" and "Drüü Könige", and the person hasn't chosen another order
- **THEN** its page lists "Drüü Könige", then "Stille Nacht", and says "2 sheets"

#### Scenario: Opening a sheet
- **WHEN** the owner selects the row "Stille Nacht"
- **THEN** the play view of "Stille Nacht" opens

### Requirement: Removing a sheet
Each row's menu SHALL hold "Remove from" and the collection's name, such as "Remove from Christmas". It SHALL take the sheet out of the collection at once, without asking. The sheet SHALL stay in the library. Each row SHALL NOT have its own remove button.

#### Scenario: Removing
- **WHEN** the owner opens the menu of "Stille Nacht" on "Christmas" and picks "Remove from Christmas"
- **THEN** the page no longer lists "Stille Nacht", and the library still does

### Requirement: Renaming a collection
"Rename" SHALL open a dialog with a name field holding the name, selected. "Save" SHALL store the new name, and the heading SHALL show it. A name the owner already uses SHALL keep the dialog open, with a note that says so. "Cancel" or Escape SHALL keep the old name.

#### Scenario: Renaming
- **WHEN** the owner renames "Christmas" to "Weihnachten"
- **THEN** the heading reads "Weihnachten", and so do its card on `/collections` and its entry in the rail

#### Scenario: Name in use
- **WHEN** the owner has "Campfire" and renames "Christmas" to "campfire"
- **THEN** the dialog stays open and says the name is already used
