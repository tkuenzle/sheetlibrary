# Spec Delta

## MODIFIED Requirements

### Requirement: New sheet
"New sheet" SHALL create a sheet titled "Untitled" with no lyrics, and open it at `/sheets/:id` with the title field open and "Untitled" selected. A reload of that sheet SHALL NOT open the field again.

#### Scenario: Starting a sheet
- **WHEN** a person selects "New sheet"
- **THEN** the sheet page opens with the heading "Untitled", and the library lists "Untitled" first

#### Scenario: Naming a new sheet
- **WHEN** a person selects "New sheet", types "Amazing Grace" and presses Enter
- **THEN** the heading reads "Amazing Grace"
