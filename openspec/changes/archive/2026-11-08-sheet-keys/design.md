# Design

## Context

The key is worked out in `useSheetKey` (`apps/web/app/editor/sheet-title.tsx`): it guesses from the chords the editor reports through `onChordsChange`, and remembers the first guess as the original. Transposing runs one editor transaction over the chords (`transpose` in `sheet-editor.tsx`). The sheet page saves what `handBackSheet` reads from the editor document.

## Decisions

### The set key is an attribute of the editor's document

The `doc` node gets a `key` attribute, `null` when none is set. `docFromSheet` fills it from the content, and `handBackSheet` writes it back. Setting the key is a transaction with `setDocAttribute`, and a transpose sets the moved key in the same transaction as the chords.

Why: the key then travels with everything else the editor already does. Autosave sees an edit and saves it, `handBack` returns it with the sheet, undo and redo cover it, and a transpose can't move the chords without the key.

Alternative: keep the set key in React state beside the editor. That needs its own path into autosave, its own undo, and a transpose would update two places that can drift.

### The original key is an attribute too

The `doc` node also gets an `original` attribute: the set key the sheet was loaded with, and the key each time one is set. Setting the key changes both in one transaction. Transposes don't touch it, and `handBackSheet` leaves it out.

Why: undoing a set key has to bring back the old original key as well. Otherwise the panel names a key that is no longer set, and "Back" can move a major sheet to a minor key. Keeping the original in React state, as first planned, can't follow undo.

### The editor reports the sheet's keys, not only its chords

`onChordsChange` reports the chords, the set key and the original key together. `useSheetKey` uses the set key when there is one and guesses otherwise. The original is the reported one, or, without one, the first key guessed.

### The key list for "Change"

It shows `keysToMoveTo(false)` and `keysToMoveTo(true)` from `chordsheet`, so its spellings match the keys to move to. No new key list is needed.

## Risks / Trade-offs

- [A guessed tonic may be spelled in a way the list doesn't have, such as G#] → The list marks the sheet's key by pitch and mode, not by spelling, as the keys to move to already do.
- [Undo covers setting the key, which the proposal leaves open] → If it shouldn't, the transaction is marked `addToHistory: false`. The approach stays the same.

## Migration Plan

None. Stored sheets have no key and keep being guessed.
