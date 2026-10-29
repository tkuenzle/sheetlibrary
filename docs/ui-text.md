# UI text

The voice and the words for what people see and hear in Sheet Library: labels, help, notes, page text, and the names screen readers read. Code, specs and docs keep their own words; for example, they say "caret".

For wording, this page wins over the design canvas. The canvas is the source for layout and looks; its text is not kept up to date.

## Voice

- **Plain:** everyday words a musician uses. No editor jargon such as "caret".
- **Short:** labels are a verb and a noun, such as "Add chord". A help line is one instruction, without a period. Only notes and page text are full sentences.
- **Direct:** say what to do. No "we", "please", "you can" or exclamation marks.
- **Calm:** nothing is an error or a warning unless something is lost.
- **Honest:** say what the app does today. "Coming soon" is the only promise.

All text is in sentence case.

## Glossary

| Use     | Not          | For                                                                                                |
| ------- | ------------ | -------------------------------------------------------------------------------------------------- |
| sheet   | song         | What the library holds. "Sheet music" is fine for the kind of thing, as on the home page.          |
| section | verse, block | A group of lines. Its label names the part, such as "Verse 1" or "Chorus".                         |
| lyrics  | words, text  | The text under the chords.                                                                         |
| letter  | character    | One spot in the lyrics, where a chord sits.                                                        |
| cursor  | caret        | Where typing happens.                                                                              |
| edit    | change       | Working on a section or a chord.                                                                   |
| Done    | OK           | Closes the chord input and keeps the chord.                                                        |
| Remove  | Delete       | Takes a chord off its letter. "Delete" is kept for something gone for good, such as a sheet later. |
| Cancel  |              | Closes the chord input without keeping what was typed. "Stop editing" (Esc) is a different action. |

## Names that stay

- **Section toolbar:** "Add chord", "Move section up" and "Move section down". Docked, the move buttons sit next to "Move", and the add button shows "Chord", but its name is still "Add chord". The toolbar is named "Section 2 of 3".
- **Chord input:** the field is named "Chord". When Done is pressed on text that isn't a chord, the note under it says "Type a chord, such as Am or G7." It says what to do, not that something went wrong.
- **Section label:** the active section without one shows "Add label". The label's field is named "Label", and suggests "Intro", "Verse", "Pre-chorus", "Chorus", "Bridge", "Solo" and "Outro".
- **Key button:** beside the title, "Key G" or "Key Em", read as "Key G" or "Key E minor". Its panel is named "Transpose to" and says "The original key, G, is guessed from the chords." The keys are written as chords are, such as "F#" and "Bbm", and read as "F sharp" and "B flat minor"; the cell with two keys is named "F sharp or G flat". The steps are "Down a semitone" and "Up a semitone", with "One semitone" between them. "Back to G" returns to the original key, and is disabled there.
- **Keys:** as printed on the key, with a space between keys pressed together: "Ctrl K", "⌘ K", "Ctrl Shift L", "⌘ ⇧ L", "Enter", "Backspace", "Esc". Help names both "Ctrl K" and "⌘ K", and both "Ctrl Shift L" and "⌘ ⇧ L", instead of guessing the platform.
