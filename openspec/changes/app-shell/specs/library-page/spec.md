# Spec Delta

## ADDED Requirements

### Requirement: Sheets and Collections screens
The page at `/sheets` SHALL be headed "Sheets", and the page at `/collections` "Collections". "Import" and "New sheet" SHALL belong to Sheets, and "New collection" to Collections. Neither SHALL show a "Library" heading or tabs.

#### Scenario: Opening Collections
- **WHEN** a person opens `/collections`
- **THEN** the heading reads "Collections", with "New collection" and without "Import" or "New sheet"

#### Scenario: Opening Sheets
- **WHEN** a person with sheets opens `/sheets`
- **THEN** the heading reads "Sheets", with "Import" and "New sheet"

## MODIFIED Requirements

### Requirement: My collections
The page at `/collections` SHALL list the signed-in person's collections and no one else's, A to Z by name. Each row SHALL show the name and how many sheets the collection holds, and SHALL open the collection at `/collections/:id`. A visitor who isn't signed in SHALL be sent to the sign-in page, and the page SHALL ask search engines not to index it.

#### Scenario: A to Z
- **WHEN** a person has the collections "Kinderlieder" with 31 sheets and "Christmas" with 14
- **THEN** the page lists "Christmas" with "14 sheets", then "Kinderlieder" with "31 sheets"

#### Scenario: Not signed in
- **WHEN** a visitor who isn't signed in opens `/collections`
- **THEN** they are sent to the sign-in page

### Requirement: No collections yet
A person without collections SHALL see "No collections yet" and "New collection" on `/collections` instead of the list.

#### Scenario: First visit
- **WHEN** a person who has no collections opens `/collections`
- **THEN** it says "No collections yet" and offers "New collection"

## REMOVED Requirements

### Requirement: Sheets and Collections tabs
**Reason**: The shell's navigation links to Sheets and Collections and marks the open one. The search field shows on every screen in the shell.
**Migration**: See "Navigation in the shell" in `site-layout`, "Search field" in `library-search`, and "Sheets and Collections screens" here.
