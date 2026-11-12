# Spec Delta

## Purpose

Finds a signed-in person's sheets by title, artist and lyrics, from a search field in the library at `/sheets`.

## ADDED Requirements

### Requirement: Search field
A person with sheets SHALL see a search field below the library's heading. A search SHALL find their sheets whose title, artist or lyrics hold every word typed, and no one else's. Without sheets, the field SHALL NOT show.

#### Scenario: Finding by lyrics
- **WHEN** a person has "Amazing Grace", whose lyrics hold "how sweet the sound", and "Hallelujah", and searches "sweet sound"
- **THEN** the library lists "Amazing Grace" and not "Hallelujah"

#### Scenario: Someone else's sheets
- **WHEN** another person has a sheet "Shenandoah", and this person searches "shenandoah"
- **THEN** no sheet is found

### Requirement: Search as you type
Results SHALL update after a short pause in typing. The search SHALL be in the address as `/sheets?q=…`, so a reload or a shared link shows the same results. Each update SHALL replace the address, not add to the history. A search SHALL start at 2 characters; with fewer, the library SHALL list all sheets.

#### Scenario: Back leaves the library
- **WHEN** a person opens the library from a sheet, types "grace" and goes back
- **THEN** the sheet opens again, not the library with "grac"

#### Scenario: One character
- **WHEN** a person types "a"
- **THEN** the library lists all their sheets, newest edit first

### Requirement: How words match
A word typed SHALL match words that start with it, so "grac" finds "Grace" and "race" doesn't. Case and accents SHALL NOT matter. Characters with a meaning in search syntax, such as quotes, `-` and `:`, SHALL be searched as text or left out, never cause an error.

#### Scenario: Without the umlaut
- **WHEN** a person has "Drüü Könige" and searches "konige"
- **THEN** "Drüü Könige" is found

#### Scenario: Search syntax
- **WHEN** a person searches `"grace -`
- **THEN** the library lists the sheets that match "grace", and no error shows

### Requirement: Best match first
Results SHALL be ordered by how well they match. A match in the title SHALL count more than one in the artist, and one in the artist more than one in the lyrics.

#### Scenario: Title before lyrics
- **WHEN** a person has "Drüü Könige" and "Sternsinger", whose lyrics hold "Könige" once, and searches "könige"
- **THEN** "Drüü Könige" is listed before "Sternsinger"

### Requirement: Matches are marked
In the results, each match SHALL be marked in the title and the artist. A sheet that matches only by its lyrics SHALL show, under its title, the first line of its lyrics with a match, with the match marked. A line too long for the row SHALL be cut so the match stays in view.

#### Scenario: Title match
- **WHEN** a person searches "könige" and "Drüü Könige" is found
- **THEN** its row marks "Könige" in the title and shows no line of lyrics

#### Scenario: Lyrics match
- **WHEN** a person searches "könige" and "Sternsinger" is found by the line "Drei Könige ziehen durchs Dorf"
- **THEN** its row shows that line under the title, with "Könige" marked

### Requirement: Number of results
While searching, the field SHALL say how many sheets match, such as "4 sheets" or "1 sheet", and screen readers SHALL announce it when it changes. The field SHALL have a button that clears the search and lists all sheets again.

#### Scenario: Count
- **WHEN** a person's search finds four sheets
- **THEN** the field says "4 sheets"

#### Scenario: Clearing
- **WHEN** a person selects "Clear search"
- **THEN** the field is empty, the address has no `q`, and the library lists all sheets

### Requirement: No results
When nothing matches, the list SHALL give way to "No sheets match" and the search, such as "No sheets match “Königin”".

#### Scenario: Nothing found
- **WHEN** a person searches "königin" and no sheet matches
- **THEN** the page says "No sheets match “königin”" and lists no sheets

### Requirement: Results follow edits
A search SHALL find a sheet by its title, artist and lyrics as last saved, including sheets saved before search existed. A deleted sheet SHALL NOT be found.

#### Scenario: After renaming
- **WHEN** a person renames "Untitled" to "Amazing Grace" and searches "amazing"
- **THEN** "Amazing Grace" is found

#### Scenario: After deleting
- **WHEN** a person deletes "Amazing Grace" and searches "amazing"
- **THEN** it isn't found
