# Proposal

## Why

Transposing (#46), the Ultimate Guitar import (#47) and display styles (#26) all need to know what a chord is. Today a chord is stored as the text the user typed and is never parsed. The stored shape has to be settled before M4 stores real sheets.

## What Changes

- **BREAKING (model):** a chord is stored as its parts, not as text: a root, an optional suffix and an optional bass, such as `{ at: 25, root: "Bb", suffix: "m7", bass: "F" }`. The model stays at version 1. Nothing is stored yet; only the seed song changes.
- The root and the bass are spelled note names: a letter from `C` to `B` and an optional `#` or `b`. `Bb` and `A#` stay apart. English names, except that `H` is read as `B`; it is stored and shown as `B`. The German `B` (B♭) is not read: `B` is always B.
- The suffix is built by a small grammar from parts in a fixed order: quality, sixth or seventh, extension, sus, alterations, added notes. Each chord has one canonical suffix, such as `m7b5` or `7sus4`, and that is what is stored. For example, `C6/9` is stored as `6add9`, `C2` as `add9`, `Caug7` as `7#5`, and `C/C` as `C`.
- A parser reads typed text into these parts. It is lenient: a lowercase root (`am`), `♭` and `♯`, and common aliases (`-`, `min`, `M7`, `Δ`, `°`, `ø`, `+`, brackets as in `7(b9)`) are read. Our own code, no library.
- The sheet shows every chord in its canonical form, so `Bb-7` shows as `Bbm7` after Done. What was typed is not kept. Opening a chord to edit it shows the canonical form.
- The chord input reads the text on Done. If it isn't a chord, the input stays open with a note, and Done does nothing until the text is a chord. Cancel still works.
- The model's check reports a chord whose root, bass or suffix isn't in canonical form.

"N.C." (no chord) is not part of this change; it is refused like any other text that isn't a chord. Transposing and display styles are separate issues.

## Capabilities

### New Capabilities

- `chord-symbols`: reading typed chord text into a root, suffix and bass, and writing a chord back in its canonical form.

### Modified Capabilities

- `chord-sheet-model`: chords are stored as root, suffix and bass instead of text, and the check covers them.
- `chord-editor`: the chord input only accepts chords, shows a note otherwise, and chords show in canonical form.

## Impact

- `packages/chordsheet`: the `Chord` type, the parser and writer, `checkSheet`, the test helpers.
- `packages/chord-editor`: the editor's chord type, the chord commands, the adapter and the chord layer's labels.
- `apps/web`: the chord input and its note, the seed song, the home page's sample sheet.
- `apps/web/e2e`: tests for the chord input.
- `docs/ui-text.md`: the note's words.

## Open Questions

- Should the sheet show `♭` and `♯` instead of `b` and `#`? The font decides where chords sit, so it must have the glyphs. This may belong to display styles (#26).
- The note's words, for example "Type a chord, such as Am or G7."
- Should the note be read out by screen readers when it shows?
