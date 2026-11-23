## RENAMED Requirements

- FROM: `### Requirement: No flashing bars without a move`
- TO: `### Requirement: Bars never blink`

## MODIFIED Requirements

### Requirement: A skeleton while a page loads
On a move inside the app to Sheets, a collection, a sheet or the account page, also by a step back in the history, the new page SHALL wait for its data until at most 150ms after the tap. Time spent before its data is asked for, such as loading the page's code, SHALL count toward those 150ms. If the data arrives in that time, the page SHALL arrive with it, without bars. Otherwise the page SHALL show and move in without waiting longer. Where data is still on its way, the page SHALL show bars inside the real row's frame, at the real row's height. When the data arrives, it SHALL take the bars' place without anything around it shifting. A page loaded in full SHALL arrive with its data, without bars.

#### Scenario: A quick collection
- **WHEN** a person on `/sheets` selects "Christmas" in the rail, and its sheets arrive after 50ms
- **THEN** the collection's page fades in with its rows, without any bars

#### Scenario: A slow collection
- **WHEN** a person on `/sheets` selects "Christmas" in the rail, and its sheets take two seconds to arrive
- **THEN** the collection's page fades in after a moment with bars in place of the rows, and the rows show when they arrive

#### Scenario: A sheet whose code is slow
- **WHEN** a person opens a sheet for the first time in a session, its code takes 100ms to load, and its data is slow
- **THEN** the sheet rises with bars, without the loading bar

#### Scenario: Back to a slow list
- **WHEN** a person opens a sheet from `/sheets`, selects Back, and the list takes two seconds to arrive
- **THEN** the sheet drops off the list's page with bars in place of the rows, and the rows show when they arrive

#### Scenario: A first load
- **WHEN** a person opens `/collections/:id` in a new tab
- **THEN** the page arrives with its rows, without bars

### Requirement: No move on top of the browser's
When the browser shows its own move for going back or forward, as when swiping back on an iPhone, the page SHALL change without a move of its own. It SHALL NOT wait for its data first: where data is still on its way, it SHALL show its bars at once.

#### Scenario: Swiping back
- **WHEN** a person on an iPhone opens a sheet from `/sheets` and swipes back from the edge
- **THEN** the list shows after the browser's swipe, without the sheet dropping again

#### Scenario: Swiping back to a slow list
- **WHEN** a person on an iPhone swipes back from a sheet to `/sheets`, and the list takes two seconds to arrive
- **THEN** the list's page with bars replaces the sheet as soon as the swipe ends

### Requirement: Bars never blink
Once a page's bars show, they SHALL stay for at least 400ms, with or without a move. A page whose data arrives within the time it waits SHALL show no bars at all, also without a move, as with reduced motion.

#### Scenario: A quick page without a move
- **WHEN** reduced motion is on and a person selects "Christmas" in the rail, and its sheets arrive after 50ms
- **THEN** the sheets show without any bars before them

#### Scenario: A slow page without a move
- **WHEN** reduced motion is on and the sheets of "Christmas" take a second to arrive
- **THEN** bars show in the rows' room after a moment, and stay until the sheets are there

#### Scenario: Data just after the wait
- **WHEN** a person selects "Christmas" in the rail, and its sheets arrive after 200ms
- **THEN** the page shows with bars, and the bars stay at least 400ms before the sheets replace them
