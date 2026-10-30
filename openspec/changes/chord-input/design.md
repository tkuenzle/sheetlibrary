# Design

## Context

The chord input lives in `apps/web/app/editor/sheet-editor.tsx`. It reads its text with `readMarkedChord` on Done. The editor page holds the key for transposing, guessed with `guessKey` whenever the chords change. `SheetEditor` doesn't get it. The section toolbar in `packages/chord-editor/src/section-toolbar.ts` already docks above the keyboard, with the iOS fixes: it lifts by `coveredByKeyboard()`, hides while the visible area moves, and keeps the caret above itself. The label field in `section-label-field.tsx` is a combobox with suggestions.

## Decisions

### Suggestions are a pure function in `chordsheet`

`suggestChords(text, sheetChords, key)` returns the row in order, each chord with whether the sheet already has it. A pure function can be tested on its own, with no DOM. #66 needs the key's chords too.

Alternative: rank in the component. Rejected, since it is harder to test, and the ranking is about chords, not the UI.

### The key's chords are moved from C

The chords of C major (`C Dm Em F G Am Bdim`) and of A minor (`Am Bdim C Dm Em E F G`) are fixed lists. `chordsOfKey(key)` moves them to the key with `transposeChord`, so they are spelled as the key spells them: `F#dim` in G, not `Gbdim`. The minor list has both fifths, as the key guess does.

Alternative: build them from pitches. Rejected, since that would need a second way to spell notes.

### Matching is a prefix on the written chord

A leading `(` or `[` is set aside as the mark. If the rest reads as a chord, its canonical form is the prefix. Otherwise the prefix is the text with the root letter in upper case and `♭` and `♯` replaced, so `dsu` matches `Dsus4`. A suggestion shows when its written form starts with the prefix. Candidates come in this order, each chord once: the sheet's chords by count (ties by first use), the key's chords, then the typed root with common suffixes (`m 7 maj7 m7 sus4 sus2 6 m6 9 m9 add9 7sus4 dim aug m7b5`). Completions need a root, so they only show while there is text. Marks are ignored when counting and comparing.

`Am` matches `Amaj7`, since the match is on the text, as #30 suggested. Slash chords only come from the sheet, or once a `/` is typed: then the key's notes complete the bass. See the open question in the proposal.

Alternative: match on the chord's parts. Rejected, since what matches would be hard to predict from what is typed.

### The input is a combobox like the label field

The field has `role="combobox"`, and the row is a `listbox` with `aria-activedescendant`. The up and down arrow keys choose, as in the label field. Left and right stay in the text. Each suggestion new to the sheet gets hidden text, "not in this sheet yet", in its name. The preview line is `aria-live="polite"`.

### `SheetEditor` takes the key

A `sheetKey` prop (`key` is taken by React) holds the page's key or null. The sheet's chords are read from the document when the input opens.

### Docking is shared with the section toolbar

The docking code moves out of `section-toolbar.ts` into a small module in `chord-editor`: lifting by the covered part, hiding while the visible area moves, and keeping a box above the docked element. The section toolbar and the chord input both use it. The chord input docks under the same `compact` media query. While it is open, the docked section toolbar hides, and the letter is kept above the input, like the caret above the toolbar.

Alternative: dock the input in the app with its own code. Rejected, since the iOS fixes were hard to get right once.

## Risks / Trade-offs

- [iOS moves the page when a docked field takes the focus] → Use the shared docking code, and check on an iPhone if one is at hand. If not, add it to the iPhone pass (#43).
- [A long row on desktop wraps to many lines] → It wraps, as on the canvas. A limit is an open question in the proposal.
- [The guessed key changes while chords are added] → The row is built when the input opens and as the text changes, so it doesn't change on its own.
