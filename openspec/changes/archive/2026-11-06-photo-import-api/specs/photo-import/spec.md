# Spec Delta

## Purpose

Reads photos of a song from a songbook into a chord sheet on the server: the endpoint, who can use it, the model behind it and what is kept.

## ADDED Requirements

### Requirement: Photos in, chord sheet out
`POST /api/photo-import` SHALL take one or more photos of one song, in page order, and answer with a chord sheet: its content, and the title and artist when the photos give them. The content SHALL be a valid chord sheet.

#### Scenario: A song read
- **WHEN** a signed-in person sends the photos of a song
- **THEN** the answer is the song's chord sheet, with the title from the page

### Requirement: No sheet is created
Reading photos SHALL NOT create or change a sheet. The browser creates the sheet with what it gets back.

#### Scenario: Library unchanged
- **WHEN** a person reads photos and does nothing with the answer
- **THEN** their library has the same sheets as before

### Requirement: The model's answer stays on the server
The answer SHALL hold only the chord sheet, its title and its artist. The text the model wrote SHALL NOT reach the browser.

#### Scenario: Only the sheet
- **WHEN** photos are read
- **THEN** the answer has no field with the model's text

### Requirement: Signed in only
Only a signed-in person SHALL be able to read photos. A request without a session SHALL be refused, and the model SHALL NOT be called.

#### Scenario: Not signed in
- **WHEN** a request without a session sends photos
- **THEN** it is refused as not signed in, and no model is called

### Requirement: A request that goes away stops the reading
When the browser's request ends before the answer, the call to the model SHALL stop.

#### Scenario: Dialog closed
- **WHEN** the browser stops a request while the model is still reading
- **THEN** the call to the model is stopped

### Requirement: The photos are not kept
The photos and the model's answer SHALL NOT be stored, neither by the site nor by the gateway between the site and the model.

#### Scenario: Gateway without logs
- **WHEN** photos are read
- **THEN** the gateway's logs hold no record of the request or the answer

### Requirement: A fake model for local use and tests
Local dev and the CI pipeline SHALL use a fake model that answers with a public-domain song. They SHALL NOT call the real model. Production and previews SHALL call the real model, each with its own API key.

#### Scenario: End-to-end test
- **WHEN** the end-to-end tests read photos
- **THEN** they get the fake model's song, and no real model is called
