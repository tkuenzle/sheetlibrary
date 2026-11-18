# Spec Delta

## MODIFIED Requirements

### Requirement: The "New sheet" menu on phones
On a phone, "New sheet" SHALL open its three ways as large buttons stacked above it, over the dimmed screen, and turn into a "Close" button while they are open. The ways SHALL rise above the button one after another, the nearest first, while the screen dims. Escape, "Close" and a tap on the dimmed screen SHALL close them, faster than they came in, with focus back on "New sheet".

#### Scenario: Opening the menu on a phone
- **WHEN** a person on a phone selects "New sheet"
- **THEN** "Write a new sheet", "From photos…" and "From Ultimate Guitar…" show above the button over the dimmed screen, and the button reads "Close"

#### Scenario: The ways rise in turn
- **WHEN** a person on a phone selects "New sheet"
- **THEN** "From Ultimate Guitar…", nearest the button, starts to rise first, then "From photos…", then "Write a new sheet"
