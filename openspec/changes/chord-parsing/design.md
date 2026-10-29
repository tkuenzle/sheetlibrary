# Design

## Context

A chord is `{ at, chord: string }` in `chordsheet` and `{ id, chord: string }` in the editor's chord mark. The chord layer shows the string as the label. The app's chord input only trims what was typed before calling `insertChord` or `changeChord`; an empty Done on an existing chord removes it. Unit tests write chords as text through helpers such as `line(text, [at, "G"])`.

## Goals / Non-Goals

**Goals:**
- One place that defines the canonical form, used by the input, the check and the tests.

**Non-Goals:**
- Transposing, key spelling and display styles. They build on this, but none of it is written here.
- Reading chords from pasted text. That comes with the import.

## Decisions

**The parser and the writer live in `chordsheet`.** `readChord(text)` returns `{ root, suffix?, bass? }` or `null`; `writeChord(symbol)` returns the canonical text. The model owns the canonical form, and its check needs it. A package of its own was the other option; it can be split out later if the play view or the import need it without the model.

**The stored chord is flat.** `Chord` is `{ at, root, suffix?, bass? }`. Suffix and bass are left out when there are none, like a section's label. A nested `{ at, chord: { root, … } }` adds a level for nothing. The editor's chord is `{ id, root, suffix?, bass? }`, the same shape with an id instead of a position.

**The suffix is stored as its canonical string, not as an object of parts.** `"m7b5"` is short and readable in JSON and diffs. The grammar turns it back into parts when needed, and that is cheap and unambiguous because the string is canonical. The check reads `C` plus the suffix and compares the written suffix with the stored one, so there is no second definition of "canonical". It also reports a bass spelled the same as the root.

**The grammar is a table of slots.** After the root, the parser tries each slot in order and takes the longest alias it finds there. Each slot is used at most once, except alterations, which may repeat and are written by degree (`b5`, `#5`, `b9`, `#9`, `#11`, `b13`). Brackets around a slot are dropped. Text left over after the last slot, or before an optional `/` and a bass, makes it not a chord.

```
 slot         canonical      aliases (examples)
 quality      m dim aug 5    min mi - ; ° o ; + +5 ; (5 = power chord)
 6 / 7        6 7 maj7       M7 ma7 Maj7 j7 Δ Δ7
 extension    9 11 13        (with maj: maj9, maj13)
 sus          sus2 sus4      sus -> sus4
 alterations  b5 #5 b9 ...   -5 +5
 added notes  add9 add11     2 add2 -> add9
```

Each chord has only one canonical form. These rules decide the cases where two spellings mean the same chord:

- **An extension holds the seventh.** `9`, `11` and `13` include it, so `79` is not written. With a seventh, `add9` becomes the extension: `7add9` → `9`, `maj7add9` → `maj9`, `m7add9` → `m9`. `add11` doesn't fold: `11` includes the 9 and `7add11` doesn't, so they are different chords.
- **A 6 has no seventh, so its 9 is added.** `6/9`, `69` and `6add9` → `6add9`, and `m69` → `m6add9`. This is the one reading rule the slots don't give: a `9` right after a `6` is an added note, not an extension. Reading tries `6/9` before a bass, so `C6/9/E` is `6add9` over E.
- **`2` is `add9`.** `C2` and `Cadd2` → `Cadd9`. Some charts mean sus2 by `2`; those sheets need `sus2` written.
- **`aug` is only for a chord without a 6, 7 or extension.** Its seventh is the plain b7, so with one it becomes `#5`: `aug7`, `+7` and `7+` → `7#5`; `aug(maj7)` → `maj7#5`; `aug9` → `9#5`. `augadd9` stays.
- **`dim` stays a quality.** The seventh of `dim7` is a bb7, which no alteration can express, so `dim7` and `°7` stay `dim7`. `dim` only goes alone or with `7`; `dim9` is not a chord. `ø` and `m7b5` → `m7b5`.
- **sus takes the third's place.** It doesn't go with `m`, `dim`, `aug` or `5`: `Cmsus4` is not a chord.
- **A bass on the root is dropped.** `C/C` → `C`, `Cm7/C` → `Cm7`. An enharmonic bass such as `C/B#` stays.
- **No brackets, alterations by degree.** `7(b9)` → `7b9`, `7#9#5` → `7#5#9`. Alterations come after sus: `7sus4(b9)` → `7sus4b9`.

These follow tonal's dictionary, which also writes `7#5`, `maj7#5` and `6add9`, and reads `2` as add9. ChordSheetJS reads `2` as sus2 and `+7` as `maj7`; we don't follow it. The full alias table is settled in code and tests, with a list of chords taken from real Ultimate Guitar sheets.

**The root is read greedily.** A letter, any case, and then an optional `#`, `♯`, `b` or `♭`. So `bb` is B♭, `Bb5` is a B♭ power chord and `C#5` is a C♯ power chord. An alteration such as `b5` or `#5` only follows a sixth, a seventh or an extension, so this is never ambiguous. That is why `+5` is an alias for `aug`: `C+5` → `Caug`.

**`H` is read as `B`.** `H` only ever means B natural, so reading it is safe, and it is stored and shown as `B`. The German `B`, which is B♭, is not read: `B` is always B natural, since nothing tells a German `B` apart from an English one. Reading the whole German system needs a notation setting, which belongs with display styles (#26).

**The app reads, the package takes parts.** `insertChord` and `changeChord` take a chord symbol instead of text. The chord input calls `readChord` on Done; on `null` it shows the note and keeps the input open. The package stays free of UI text and of input handling, and its labels use `writeChord`. The note uses the existing `Note` component under the field; the input gets `aria-invalid` and `aria-describedby` pointing to it. The note goes away when the text changes. Empty text keeps working as before: Done closes a new chord's input and removes an edited chord.

**Test helpers take text.** `line(text, [at, "Bbm7"])` reads each chord with `readChord` and throws when it isn't one. Tests stay readable, and a typo in a test fails loudly.

## Risks / Trade-offs

- [The grammar refuses chords that real sheets use] → The import would miss chord lines. Test against a list of chords from Ultimate Guitar sheets, and add aliases as they come up.
- [The canonical form changes after M4 stores sheets] → Stored suffixes would need a migration. The rules above settle the known edge cases; add any new one before M4 stores sheets.
- [`2` meant sus2] → Such a sheet shows `add9`, and the third comes back. Writing `sus2` fixes it.
- [What the user typed is gone] → Someone who types `C-7` sees `Cm7`. This was chosen; display styles (#26) give the choice back as a setting.

## Open Questions

- Whether `♭` and `♯` are shown instead of `b` and `#`. It only changes `writeChord`'s output for display, not what is stored.
