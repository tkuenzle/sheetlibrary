# Design

## Context

Since #82, the chord layer draws each stored chord moved `{ from, to }` through the shown-key plugin (`packages/chord-editor/src/shown-key.ts`), and nothing is saved. `useSheetKey` (`sheet-title.tsx`) holds the shown key, and writes it to `?key` with `history.replaceState`. `SheetEditor` gets the shown key as a prop: it passes it to the layer, and the chord input works in it. `keyAbove` in `chordsheet` spells a key as the keys to move to do, with F# and Ebm at the tie. `readUltimateGuitar` returns only a sheet.

## Decisions

### A capo is a different `to`

`useSheetKey` also holds the capo, 0 for none. The key the chords are drawn in is `keyAbove(shown ?? song, -capo)`. `SheetEditor` gets that key in place of the shown key, so the layer, the chord input and the commit back to the song key work unchanged. `chord-editor` doesn't change.

Why: it reuses the one path #82 built for showing chords in another key, without a mapping and back.

Alternative: a separate capo in the plugin state. That's two moves to add up in the layer and in the chord input, for the same result.

### A transpose moves the capo, in the reducer

The reducer's `show` action, used by picks, steps and "Back", works out the shapes before the move, then the fret from them to the new shown key. From 1 to 9, that is the new capo; 0 means no capo; 10 or 11 keeps the old capo. The `chords` action, used by "Change" and a new guess, keeps the capo as it is: the shown key keeps its distance there, so the shapes don't change anyway.

### The address holds both

The effect that writes `?key` writes `?capo` too, from the same state. Each page reads `?capo` once, as it reads `?key`: the sheet page through its loader, `/editor` through `useSearchParams`. A small `readCapo` reads "3" and returns a fret from 1 to 9, or null.

### No capo button without a key

The shapes are spelled from a key. A sheet without chords and without a set key has no key, so it gets no capo button, as it gets no key button.

### Reading the capo apart from the sheet

A new `readUltimateGuitarCapo(text)` in `chordsheet` returns the fret or null. `readUltimateGuitar` stays as it is. The import form calls it as the text changes. The field follows the text until the person picks a value themselves.

Why: the form needs the capo on each change of the text, before importing, and reading the whole sheet on each keystroke isn't needed for that.

### Moving up on import

On import, the form guesses the key of the read chords, moves every chord from that key to `keyAbove(key, capo)` with the existing `transposeChords` logic, and passes the capo with the sheet: `onImport(sheet, capo)`. `/editor` resets the sheet key with that capo. The library opens `importedSheetPath(id)` with `?capo=N` added. Without a key to guess, there is nothing to move, and no capo is passed.

## Risks / Trade-offs

- [Moving up and showing back down can respell an unusual chord] → It happens once, at import, and only with a capo. The shown chords use the same key spelling as a transpose.
- [UG's own transpose button changes the chords but not the `Capo:` line] → The field can be changed before importing.
- [The router's location goes stale after `replaceState`] → As with `?key`, nothing reads it after the page loads.

## Migration Plan

None. Stored sheets don't change.
