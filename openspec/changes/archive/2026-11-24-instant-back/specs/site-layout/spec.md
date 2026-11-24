## ADDED Requirements

### Requirement: Back shows the page as it was left
On a step back or forward in the history to Collections, a collection, the account page or a search on Sheets, the page SHALL show at once what it showed when it was left, at the same scroll, without waiting for the server. It SHALL then load again and keep what it shows until the fresh data is there. This applies only when the page was shown in this session and no change was made since. A sheet SHALL load as before.

#### Scenario: Back to a slow collection
- **WHEN** a person opens a sheet from the collection "Christmas", selects Back, and the collection takes two seconds to arrive
- **THEN** the sheet drops off "Christmas" with its rows and no bars, and the heading moves back into its row

#### Scenario: Fresh data after Back
- **WHEN** a sheet was added to "Christmas" on another device, and a person goes back to "Christmas"
- **THEN** the page shows its rows as it left them, and the new sheet's row shows when the fresh data arrives

### Requirement: Back to Sheets
On a step back or forward to Sheets without a search, the page SHALL wait up to 150ms for its fresh data, as on any other move. When the data is late, or the browser showed its own move, Sheets SHALL show the list as it was left at once, with bars only in "Recent", since opening a sheet changes "Recent". The rest SHALL follow "Back shows the page as it was left".

#### Scenario: Back to Sheets when slow
- **WHEN** a person opens a sheet from `/sheets`, selects Back, and the list takes two seconds to arrive
- **THEN** the sheet drops off the list with its rows, "Recent" shows bars, and the cards show when the data arrives

#### Scenario: Back to a quick list
- **WHEN** a person opens "Stille Nacht" from `/sheets`, selects Back, and the list arrives after 50ms
- **THEN** the sheet drops onto the fresh list without bars, with "Stille Nacht" first in "Recent"

### Requirement: The frame on a step back
On a step back or forward to a screen of the shell, the navigation SHALL show the collections as it last showed them, without waiting for the server. They SHALL load again with the page.

#### Scenario: Slow collections
- **WHEN** a person goes back from a sheet to the collection "Christmas", and the list of collections takes two seconds to arrive
- **THEN** the sheet drops off "Christmas" at once, with the rail and its collections

### Requirement: A change forgets what Back shows
Any change to the person's data SHALL forget every page kept for a step back. A step back after a change SHALL load the page as on any other move.

#### Scenario: A renamed sheet
- **WHEN** a person opens "Amazing Grace" from `/sheets`, renames it to "Grace" in edit mode, picks Done, and selects Back
- **THEN** Sheets never shows "Amazing Grace"

### Requirement: A failed load after Back
When the page fails to load again after a step back, offline too, it SHALL keep what it shows, without a note.

#### Scenario: Offline Back
- **WHEN** a person opens a sheet from the collection "Christmas", goes offline, and selects Back
- **THEN** "Christmas" shows its rows as it left them, and stays

## MODIFIED Requirements

### Requirement: No move on top of the browser's
When the browser shows its own move for going back or forward, as when swiping back on an iPhone, the page SHALL change without a move of its own. It SHALL NOT wait for its data first: it SHALL show what it showed when it was left (see "Back shows the page as it was left" and "Back to Sheets"), and where data is still on its way, it SHALL show its bars at once.

#### Scenario: Swiping back
- **WHEN** a person on an iPhone opens a sheet from `/sheets` and swipes back from the edge
- **THEN** the list shows after the browser's swipe, without the sheet dropping again

#### Scenario: Swiping back to a slow list
- **WHEN** a person on an iPhone swipes back from a sheet to `/sheets`, and the list takes two seconds to arrive
- **THEN** the list replaces the sheet with its rows as soon as the swipe ends, with bars in "Recent"

### Requirement: A skeleton while a page loads
On a move inside the app to Sheets, a collection, a sheet or the account page, the new page SHALL wait up to 150ms for its data, and arrive with it, without bars, if it comes in that time. Otherwise it SHALL show and move in, with bars inside the real row's frame, at the real row's height, where data is still on its way. When the data arrives, it SHALL take the bars' place without anything around it shifting. A page loaded in full SHALL arrive with its data, without bars.

#### Scenario: A quick collection
- **WHEN** a person on `/sheets` selects "Christmas" in the rail, and its sheets arrive after 50ms
- **THEN** the collection's page fades in with its rows, without any bars

#### Scenario: A slow collection
- **WHEN** a person on `/sheets` selects "Christmas" in the rail, and its sheets take two seconds to arrive
- **THEN** the collection's page fades in after a moment with bars in place of the rows, and the rows show when they arrive

#### Scenario: Back to a slow list
- **WHEN** a person opens a sheet from `/sheets`, edits it, picks Done, selects Back, and the list takes two seconds to arrive
- **THEN** the sheet drops off the list's page with bars in place of the rows, and the rows show when they arrive

#### Scenario: A first load
- **WHEN** a person opens `/collections/:id` in a new tab
- **THEN** the page arrives with its rows, without bars
