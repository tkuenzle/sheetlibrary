# Design

## Context

`chordsheet` already has `readMarkedChord`, which reads `(C)` as held and `[C]` as optional, and `cleanUpSection` and `cleanUpLabel`, which the Ultimate Guitar reader uses. The envelope keeps `title` and `artist` beside `content`, with `TITLE_MAX` and `ARTIST_MAX`. The prompt exists only as text in `docs/photo-import-spike.md`.

## Goals / Non-Goals

**Goals:**
- One pure function from an answer to what #93 needs to make a sheet, with no model calls in `chordsheet`.

**Non-Goals:**
- Reading ChordPro files from other apps. #98 decides whether to reuse this code.
- Running the edited prompt. That needs the spike photos, which stay outside the repository.

## Decisions

**`readPhotoAnswer(text)` returns `{ title?, artist?, content }`.** The names match the envelope, so #93 can put them into a sheet as they are. A title or artist is cleaned up as a label is, and is left out when nothing is left. It lives in `src/photo-answer.ts`, beside `ultimate-guitar.ts`.

**Two steps inside: lines, then sections.** Each line, after NFC and splitting on any line break, is a blank line, a directive `{name: value}` or a lyrics line with inline chords. Then the lines are grouped into sections, and each goes through `cleanUpSection`. This keeps the syntax apart from the rules, so #98 can reuse the first step if it wants. Nothing outside the file sees the split.

**The text inside the brackets goes to `readMarkedChord`.** `[(C)]` gives `(C)`, which is held, and `[[C]]` gives `[C]`, which is optional. So the answer uses the app's own notation, and the reader needs no rules of its own for marks. A bracket that `readMarkedChord` can't read, such as `N.C.` or an empty `[]`, is dropped. An inline chord ends at the first `]`, or at `]]` when it starts with `[[`. A `[` with no closing bracket stays as text.

**The prompt is a TypeScript string.** `src/photo-answer-prompt.ts` exports it as `PHOTO_ANSWER_PROMPT`, with the backticks of the examples escaped. A `.md` file imported with `?raw` would read better, but it only works through Vite and would need Vite's types in `chordsheet`. The test reads each inline example in the prompt and checks it gives the chords the prompt describes.

## Risks / Trade-offs

- [The model writes `[(C)]` for every chord in parentheses, out of ChordPro habit] → It reads as held, which is a fair guess. #102 counts how often it happens.
- [The edited prompt is not run in this change] → The changes are small and follow the reader. #93 runs it on the spike songs before it ships.
- [A lyric with `{` at the start of a line reads as a directive] → Songbooks rarely print braces. Only a whole line in braces is a directive.
