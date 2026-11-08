# Proposal

## Why

A sheet's key is guessed from its chords each time (#58). The guess can be wrong, such as G for a song in Em, and it can flip after an edit. Transposing without saving (#82) and capo (#95) will store a key to play in, and that needs the song's own key to stay put. So the person needs a way to say which key the song is in, without moving its chords.

## What Changes

- A chord sheet's content can hold its key: a tonic, and major or minor. A sheet without one keeps working as today: its key is guessed from the chords.
- Once a key is set, it is the sheet's key. It is not guessed again after edits.
- The key panel names the original key. Next to it, "Change" lists the major and minor keys. Picking one sets the sheet's key and moves no chord.
- Transposing still moves the chords, as today. A set key moves with them, so it stays true.
- On the sheet page, a set key saves like any other edit. On `/editor` it is kept until the page is left, like everything else there.
- Not in this change: a key for a single section (split off from #58 into its own issue), showing the key in the library, and taking a key from an import.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `chord-sheet-model`: content may hold the sheet's key, and checking reports a key that isn't valid.
- `transposition`: the sheet's key is the set key if there is one, else the guess. A set key moves with a transpose.
- `editor-page`: the key button shows the set key; the panel says whether the key is guessed and lets the person change it.
- `sheet-page`: a set key saves like any other edit.

## Impact

- `packages/chordsheet`: the `ChordSheet` type and `checkSheet` (`sheet.ts`, `check.ts`).
- `packages/chord-editor`: the document holds the key, so it is handed back with the sheet and saved.
- `apps/web/app/editor`: `useSheetKey` and `SheetTitle` in `sheet-title.tsx`, and `key-button.tsx`.
- Stored sheets don't change. The content's version stays 1, since the key is optional.

## Open Questions

- Is setting the key one step to undo, like a transpose?
- Can a key be set on a sheet without chords? Today such a sheet has no key button.
- Should the library show the key? Library features read only the envelope, so the envelope would need a copy.
- Should an import set the key: photo import from the key signature, Ultimate Guitar from its "Key" line?
- When a key is set while the sheet is transposed, the old original key is lost, and "Back" goes to the new one. Fine until #82, where transposing stops moving the chords?
