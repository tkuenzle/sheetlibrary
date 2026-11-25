# Spec Delta

## MODIFIED Requirements

### Requirement: What the skeleton already knows
A skeleton SHALL show for real what the browser already knows. A collection SHALL show its name and its number of sheets, and as many rows of bars as it has sheets, up to a screenful. A sheet opened from a row SHALL show its title and artist. The account page SHALL show as many passkey rows of bars as the account has passkeys, and "No passkeys yet" when it has none.

#### Scenario: A collection's count
- **WHEN** a person selects "Christmas", which holds 3 sheets, and its sheets are slow to arrive
- **THEN** the page shows "Christmas", "3 sheets" and three rows of bars

#### Scenario: A sheet from a row
- **WHEN** a person selects "Stille Nacht" on `/sheets`, and the sheet is slow to arrive
- **THEN** the sheet rises with "Stille Nacht" and its artist in the heading, and bars in place of its lines

#### Scenario: The account's passkeys
- **WHEN** a person with one passkey selects the account in the navigation on a phone, and the passkeys are slow to arrive
- **THEN** the page shows one passkey row of bars, and the real row takes its place without the rows below it moving

### Requirement: Bars in the dialogs that load
"Add sheets" and "Choose collections" SHALL show bars in their list while it loads, but only when it takes longer than 200ms; until then the list's room SHALL stay empty. Once shown, the bars SHALL stay for at least 400ms, so they never flash. Controls that need the list SHALL wait until it is there. On a sheet's page, in play and in edit mode, "Choose collections" SHALL open with its list, without bars. From a row's menu, its list SHALL start loading when the menu opens.

#### Scenario: Choose collections
- **WHEN** a person picks "Choose collections…" in a row's menu, and the collections are slow to arrive
- **THEN** the dialog shows its title and rows of bars, "New collection" can't be picked yet, and "Done" closes it

#### Scenario: A quick list
- **WHEN** a person picks "Choose collections…" in a row's menu, and the collections arrive after 50ms
- **THEN** the collections show without any bars before them

#### Scenario: On a sheet's page
- **WHEN** a person opens "Choose collections…" in the menu of a sheet's page, in play or in edit mode
- **THEN** the dialog opens with the collections and their ticks, without bars, and keeps its size
