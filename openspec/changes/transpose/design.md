# Design

## Context

A chord is `{ at, root, suffix?, bass? }` in `chordsheet` and `{ id, root, suffix?, bass? }` in the editor's chord mark, with root and bass as spelled notes (`chord-symbols`). The editor's state is a ProseMirror document with `prosemirror-history`, so one transaction is one undo step. The `/editor` route renders the heading outside `SheetEditor` and only hears `onEditedChange` from it. Clicks outside the sheet end editing unless the control is marked `data-keeps-editing`, as the help button is.

## Goals / Non-Goals

**Goals:**
- Key theory in one place, in `chordsheet`, with no UI.
- The guess, the list and the move agree, so the button shows the key that was picked.

**Non-Goals:**
- A stored key, keys per section, a capo (#58).
- Double sharps and double flats. A spelled note has at most one `#` or `b`.

## Decisions

**Keys live in `chordsheet`.** A key is `{ tonic, minor }`, the tonic a spelled note. New functions: `guessKey(chords)` returns a key or `null` when there are no chords; `keysToMoveTo(minor)` returns the twelve cells, one holding two keys at the tie; `stepKey(key, ±1)`; and `transposeChord(chord, from, to)`. The model owns the spelling rules, and the import (#47) and #58 will need them without the editor.

**A chord moves by a spelled interval.** The interval from the old tonic to the new one is counted in letters and in semitones: G to Bb is two letters and three semitones. Each root and bass moves by the same: C goes two letters to E, and three semitones make it Eb. Chords in the key land on the new key's spelling, and a chord outside it keeps its relation: F in G (the flat seventh) becomes G in A. Respelling is the same move with zero semitones: G# to Ab is one letter, so C# becomes Db. Where the move would need a double sharp or flat, the plain note with one accidental is used, on the new key's side: an Fm in G# respelled to Ab stays Fm, not Gbbm. Mapping each pitch to the new key's scale was the other option, but it loses how a chord outside the key relates to the key.

**The guess scores all 24 keys.** A chord counts for a key when its root is a degree of that key's scale and its third fits: in G, Em counts and E doesn't. The key that holds the most chords wins. A tie goes to the key whose tonic chord starts or ends the sheet, then to the one whose tonic chord comes most often, then to major. The score only looks at intervals, so moving a sheet moves its guess by the same amount, and the button shows the picked key. The tonic is spelled as the sheet spells that pitch, so a sheet written in G# is in G#. A sheet with G, C and D is in G, since D major isn't a chord of C.

**The editor takes a function, not a key.** `chord-editor` gets `transposeChords(move)`, a command that replaces every chord in the document with `move(chord)`, keeping ids, in one transaction, with the selection kept. The package knows no music theory, and the command is one undo step. `chordsIn(doc)` lists the chords in order for the guess.

**The route holds the key.** `SheetEditor` reports the chords through a new `onChordsChange`, called when the document changes, and its handle gets `transpose(move)`. The route guesses the key and renders the key button beside the heading. It also keeps the original key: the one guessed when the sheet was loaded, or the first one guessed after that. #58 replaces it with the stored key. It is marked `data-keeps-editing`, so opening it keeps the active section.

**One `<dialog>` for the panel.** It opens with `show()` under the button on wider windows, and with `showModal()` as a bottom sheet on a phone, like the side panel's sheet. Escape or a click outside closes it, and focus goes back to the button. The cells are buttons; the current key has `aria-pressed`. The split cell is a group of two buttons. The panel keeps focus after a pick and stays open.

**Undo reaches the editor from the panel.** The panel catches Mod-z, Shift-Mod-z and Mod-y and runs the editor's `undo` and `redo` through the handle. Focus stays in the panel.

**"Back to G" transposes to the original key.** It moves the chords from the current key to the original one, like any pick. A chord added after transposing moves back with the others, which restoring a snapshot by id would miss. A move and the move back cancel out, except where a double accidental fell back to the plain note. The button is always there and disabled in the original key, so the panel keeps its size.

## Risks / Trade-offs

- [The guess is wrong for a sheet that starts and ends away from its key] → The spelling is usually the same either way, and a wrong guess only shows on the button. #58 lets the user set the key.
- [A sheet that changes key is spelled in one key] → Its other section may get odd spellings, such as A# where Bb fits. #58 adds keys per section.
- [Chord spelling outside the key surprises someone] → The rule is the same for every chord. Test it with sheets from Ultimate Guitar.
- [Chord edits change the guess without a transpose] → "Back" then moves the sheet to the original guess, even if the chords now say another key. #58 stores the key, so it no longer depends on the guess.
