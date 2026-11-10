## ADDED Requirements

### Requirement: Lyrics only for the view
The play view SHALL have "Lyrics only", which shows the sheet with the view's lyrics only. It SHALL NOT change the stored sheet. While it is on, the key and capo buttons SHALL be hidden. Printing SHALL print the sheet as shown, so with lyrics only it prints the lyrics.

#### Scenario: Turning chords off and on
- **WHEN** the owner shows a sheet in G in A, picks "Lyrics only", then picks it again
- **THEN** the chords and the key and capo buttons go away, then come back with the chords in A

#### Scenario: Printing the lyrics
- **WHEN** the owner picks "Lyrics only" and then "Print"
- **THEN** the print preview shows the title, the artist and the lyrics, without chords

### Requirement: Lyrics only in the address
The address SHALL hold `lyrics` while lyrics only is on, next to `key` and `capo`, and follow the toggle without loading the page again. A page opened with `lyrics` in its address SHALL show lyrics only, complete before JavaScript. While lyrics only is on, the address SHALL keep `key` and `capo`.

#### Scenario: Opened with lyrics only
- **WHEN** the owner opens `/sheets/:id?lyrics&key=A` with JavaScript turned off
- **THEN** the page shows the lyrics without chords

#### Scenario: Address follows
- **WHEN** the owner shows a sheet in A and picks "Lyrics only"
- **THEN** the page doesn't load again, and the address holds `lyrics` and `key=A`

### Requirement: Where Lyrics only sits
On a wide screen, "Lyrics only" SHALL be a toggle with its name, before "Smaller text", "Larger text" and "Print" in the top bar, marked while on. On a phone, it SHALL be the first item in the menu, checked while on, and a "Lyrics only" label SHALL show in place of the key and capo buttons.

#### Scenario: On a phone
- **WHEN** the owner opens the menu on a phone and picks "Lyrics only"
- **THEN** the chords go away, "Lyrics only" shows where the key and capo buttons were, and the menu item is checked the next time the menu opens
