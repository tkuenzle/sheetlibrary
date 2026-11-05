# photo-answer-format Specification

## Purpose
Defines the format a vision model answers in when it reads photos of a song for photo import: the prompt that asks for it, and how an answer is read into a chord sheet with its title and artist.

## Requirements

### Requirement: An internal format
The photo answer SHALL be read into a chord sheet as soon as it arrives and SHALL NOT be stored. The format MAY differ from ChordPro. It SHALL carry only what a chord sheet and its envelope can hold.

#### Scenario: Only the sheet is kept
- **WHEN** an answer is read
- **THEN** the result is a chord sheet, a title and an artist, and nothing of the answer's text is kept

### Requirement: A valid sheet
Reading any text SHALL give a valid chord sheet, with its lyrics in NFC and each section cleaned up as the editor cleans up a section.

#### Scenario: Any text
- **WHEN** any text is read, such as a broken answer or a run of blank lines
- **THEN** the result passes the sheet's check, with no problems

### Requirement: Title and artist
The title SHALL come from `{title: …}` and the artist from `{artist: …}`. An answer without one of them SHALL give no title or no artist.

#### Scenario: Details read
- **WHEN** an answer starts with `{title: Drüü Könige}` and has no `{artist}`
- **THEN** the title is "Drüü Könige" and there is no artist

### Requirement: Chords inline
A chord in square brackets SHALL sit at the position of the text that follows it. A chord at the end of a line SHALL sit after its last letter. A line of only chords SHALL be a line of chords only, and text after its last chord, such as `x2`, SHALL be kept.

#### Scenario: Chords on letters
- **WHEN** the line `A[D]mazing [G]grace` is read
- **THEN** the line is "Amazing grace", with D on the "m" and G on the "g" of "grace"

#### Scenario: Chord after a word
- **WHEN** the line `grace[D7] how` is read
- **THEN** D7 sits after "grace", before the space

#### Scenario: Intro played twice
- **WHEN** the line `[D] [A] [Bm] [G] x2` is read
- **THEN** it is a line with the chords D, A, Bm and G, then the text "x2"

### Requirement: Held and optional chords
A chord in round brackets inside the square brackets, such as `[(C)]`, SHALL be held. A chord in a second pair of square brackets, such as `[[C]]`, SHALL be optional.

#### Scenario: Both marks
- **WHEN** the line `[(C)]Oh [[F]]yes` is read
- **THEN** the line has a held C on "Oh" and an optional F on "yes"

### Requirement: Unreadable chords are dropped
A chord in square brackets that is not a chord, such as `[N.C.]`, SHALL be dropped. The text around it SHALL stay.

#### Scenario: No chord
- **WHEN** the line `[N.C.]Hey [G]you` is read
- **THEN** the line is "Hey you", with only G

### Requirement: Sections come from directives
A `{start_of_…}` directive, such as `{start_of_verse: Strophe 1}` or `{start_of_chorus: Refrain}`, SHALL start a section, labeled with the text after the colon as written, and cut to fit if it is longer than a label can be. Which kind of section it is SHALL NOT be kept. An `{end_of_…}` directive SHALL end the section. Lines outside any section SHALL form a section without a label. Blank lines SHALL be ignored.

#### Scenario: Verse and refrain
- **WHEN** `{start_of_verse: Strophe 1}`, two lines, `{end_of_verse}`, a blank line, `{start_of_chorus: Refrain}`, one line and `{end_of_chorus}` are read
- **THEN** the sheet has a section "Strophe 1" with two lines and a section "Refrain" with one

#### Scenario: Blank line inside a section
- **WHEN** a section has a blank line between its two lines
- **THEN** it is one section with both lines

### Requirement: Other directives are dropped
Every other directive, such as `{comment: …}`, `{composer: …}` or `{lyricist: …}`, SHALL be dropped.

#### Scenario: Comment and credits
- **WHEN** an answer has `{composer: …}`, `{lyricist: …}` twice and `{comment: D.S. al Coda}` inside a verse
- **THEN** none of them appear in the sheet, and the verse keeps its other lines

### Requirement: The prompt matches the reader
The prompt that asks a vision model for the answer SHALL ship with the reader, so the format changes in one place. It SHALL ask only for what the reader keeps. Each example in the prompt SHALL read as the prompt describes it.

#### Scenario: Prompt examples
- **WHEN** the prompt's examples, such as `A[D]mazing [G]grace`, are read
- **THEN** each gives the chords on the letters the prompt says
