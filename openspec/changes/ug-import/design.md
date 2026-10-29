# Design

## Context

`chordsheet` has `readChord`, which returns `null` for anything that isn't a chord, and `cleanUpSection`, which trims a section's lines the way the editor does. A chord's `at` must be at most the length of the line's text, so a line of chords only is a run of spaces with a chord on each. `SheetEditor` reads its `sheet` once, when it mounts; a new React `key` loads another sheet. `/editor` holds the key and the original key, and gets `edited` from the editor through `onEditedChange`. Native `<dialog>` is already used by the side panel and the key button.

ChordSheetJS has an Ultimate Guitar parser. Its chord-line test is a loose regex (`Feed Every Dog` passes), it doesn't handle bars or tabs, and it builds its own song model. We write our own and take its test cases: lyrics with wide gaps, lyrics that start with note letters, and CJK lyrics.

## Goals / Non-Goals

**Goals:**
- One pure function from pasted text to a valid `ChordSheet`, with no UI, so M4 can call it from the library and other formats can sit beside it.
- No new editor API for a way in that moves to the library later.

**Non-Goals:**
- The `[ch]…[/ch]` markup that UG's own data uses. That comes with importing from a URL (#38).
- Reading `Capo:`, `Key:` or the title into the sheet. Sheets can't hold them yet.

## Decisions

**`readUltimateGuitar(text)` in `chordsheet`.** It lives in `src/ultimate-guitar.ts` and returns a `ChordSheet`. It works in two passes. First each line is classified as blank, header, tab, chord line or lyrics, after NFC and splitting on any line break. Then the lines are grouped into sections, and each section goes through `cleanUpSection`. A section that is empty after that is left out. ChordPro (#37) will be a `readChordPro` beside it.

**A chord line is checked word by word.** The line is split on spaces. Each word must be a chord by `readChord`, or one of the filler words: `|`, `N.C.`, or a repeat count matching `x\d+`, `\d+x` or the same in brackets. Bars stuck to a chord, as in `|G`, are split off first. At least one word must be a chord. This is stricter than ChordSheetJS's regex and uses the same reader as the chord input, so whatever the import accepts, the editor accepts.

**Columns go through a width map.** For each lyrics line, a map from column to string index is built, where a letter that East Asian Width calls wide or fullwidth takes two columns. A chord at column c goes on the letter covering c, so a chord over the second half of a wide letter goes on that letter. Widths come from `get-east-asian-width`, a small package with no dependencies that follows the Unicode tables. It is `chordsheet`'s first runtime dependency. A hand-written table was the other option, but it goes stale and misses ranges.

**A line of chords only is spaces, then any repeat count.** Each chord gets its own space, in order, and a repeat count follows after a space, such as `x2`. Clean-up keeps the spaces that hold chords.

**An empty header repeats its group.** While grouping, the importer remembers, for each header text, the sections that header started. A header that gets no lines copies the group of the last header with the same text. The text is compared after the same clean-up as labels. Without an earlier match, the header is dropped for now (see the proposal's Open Questions).

**The page remounts the editor.** `/editor` keeps the loaded sheet and a counter in state. Importing sets both, and `SheetEditor` gets the counter as its `key`. The page sets the original key from the imported chords right away, and keeps an `imported` flag that it ORs with the editor's `edited` for the leave warning. The editor's undo history starts fresh, so the import can't be undone. The dialog says the sheet is replaced.

**The dialog is its own component.** `ImportDialog` in `apps/web/app/editor/` uses `showModal()`, with a label, a `<textarea>`, a note that the sheet is replaced, and Cancel and Import. The button that opens it sits in the top bar's actions, with an icon and the text "Import" on wider windows, and only the icon on a phone. Its name is always "Import from Ultimate Guitar". The text in the field is kept only while the dialog is open.

## Risks / Trade-offs

- [A one-word lyrics line such as "A" or "Em" is read as chords] → Rare in songs. The user can fix it in the editor.
- [UG pages copied in a browser may add text around the sheet, such as ratings or "Chords" headers] → It comes in as lyrics. Test with pages copied from Chrome, Safari and Firefox, and add fixtures for what they give.
- [Fonts on UG aren't always monospace for every script] → The width map follows the Unicode tables, which is what UG's monospace layout assumes.
- [The import can't be undone, so edits made before it are lost] → The dialog says the sheet is replaced. Nothing on this page is saved anyway, and in the library an import makes a new sheet.
