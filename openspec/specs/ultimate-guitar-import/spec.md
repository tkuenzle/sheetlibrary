# ultimate-guitar-import Specification

## Purpose
Reads text copied from an Ultimate Guitar page, with chord lines above lyrics and headers such as `[Verse 1]`, into a chord sheet.

## Requirements

### Requirement: A valid sheet
Reading any text SHALL give a valid chord sheet, with its lyrics in NFC and cleaned up as the editor cleans up a section.

#### Scenario: Any text
- **WHEN** any text is read, such as a recipe or a run of blank lines
- **THEN** the result passes the sheet's check, with no problems

### Requirement: Chord lines
A line SHALL be a chord line when each word on it is a chord, a chord in round brackets, a bar `|`, a repeat count such as `x2` or `(x2)`, or `N.C.`, and at least one word is a chord or a chord in round brackets. Its chords SHALL be kept, in their canonical form. Its other words SHALL be dropped, except as the next requirement says.

#### Scenario: Bars
- **WHEN** the line `|G   |D   |Em  |C   |` is read
- **THEN** it gives the chords G, D, Em and C

#### Scenario: Lyrics that look like chords
- **WHEN** the line `Am I wrong` is read
- **THEN** it is a lyrics line, since "I" and "wrong" are not chords

#### Scenario: Only a chord in brackets
- **WHEN** the line `(Am)` is read
- **THEN** it is a chord line with one chord, Am

### Requirement: Chords in round brackets
A chord in round brackets, such as `(C)`, SHALL be held when the chord before it is the same chord, and optional otherwise. The chord before it is the one just before it in the text, in any earlier line or section. The same chord means the same root, suffix and bass. A chord with nothing before it SHALL be optional.

#### Scenario: Held into the chorus
- **WHEN** `[Verse]`, `G  C` above a lyrics line, then `[Chorus]` and `(C)  D` above a lyrics line are read
- **THEN** the chorus starts with a held C, then D

#### Scenario: Optional chord
- **WHEN** `G  (C)  D` is read above a lyrics line
- **THEN** the line has G, an optional C and D

### Requirement: Chords on the lyrics below
A chord line followed by a lyrics line SHALL put each chord on the letter of that line under the chord's first character, counting wide letters, such as Chinese or Japanese, as two columns. A chord past the end of the lyrics SHALL go after it, in order.

#### Scenario: Chords over lyrics
- **WHEN** `G                  D` is read above `Amazing grace, how sweet the sound`
- **THEN** G sits on the "A" of "Amazing" and D on the "s" of "sweet"

#### Scenario: Wide letters
- **WHEN** `G        D/F#` is read above `人算什麼 祢竟顧念他`
- **THEN** G sits on "人" and D/F# on "祢"

### Requirement: Lines of chords only
A chord line not followed by a lyrics line SHALL become a line of chords only, in order. A repeat count on it SHALL be kept as text after the last chord.

#### Scenario: Intro with a repeat count
- **WHEN** `[Intro]` is read, then `D A Bm G x2`
- **THEN** the section "Intro" has one line with the chords D, A, Bm and G, then the text "x2"

### Requirement: Headers start labeled sections
A line that is only text in square brackets, such as `[Verse 1]`, SHALL start a new section labeled with that text. A label longer than a section label can be SHALL be cut to fit.

#### Scenario: Verse and chorus
- **WHEN** `[Verse 1]`, two lines, `[Chorus]` and one line are read
- **THEN** the sheet has a section "Verse 1" with two lines and a section "Chorus" with one

### Requirement: Empty headers repeat a section
A header with no lines before the next header or the end SHALL repeat what the last earlier header with the same text started: its section, and the sections without a label that followed it up to the next header.

#### Scenario: Chorus again
- **WHEN** `[Chorus]` with two lines, `[Verse 2]` with one line, and `[Chorus]` alone are read
- **THEN** the sheet ends with a section "Chorus" with the same two lines as the first

#### Scenario: Chorus in two parts
- **WHEN** `[Chorus]` with two lines, a blank line and two more lines, then `[Chorus]` alone are read
- **THEN** the sheet ends with a section "Chorus" with the first two lines and a section without a label with the other two

### Requirement: Blank lines split sections
A blank line SHALL end the section. The lines after it SHALL start a new section without a label. Blank lines at the start of a section SHALL be skipped.

#### Scenario: Two stanzas under one header
- **WHEN** `[Verse 1]`, two lines, a blank line and two more lines are read
- **THEN** the sheet has a section "Verse 1" with two lines, then a section without a label with two lines

### Requirement: Tabs are dropped
A tab line, a string name followed by `|` and the frets, such as `e|---3---|`, SHALL be dropped.

#### Scenario: Riff in tab
- **WHEN** a section with a lyrics line and six tab lines is read
- **THEN** the section has only the lyrics line

### Requirement: Other lines are lyrics
Every other line SHALL be kept as a lyrics line without chords, including lines such as `Capo: 2nd fret` or `Key: G`.

#### Scenario: Capo line
- **WHEN** `Capo: 2nd fret` is read before the first header
- **THEN** the sheet starts with a section with the line "Capo: 2nd fret"
