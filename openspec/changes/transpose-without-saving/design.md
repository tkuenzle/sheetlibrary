# Design

## Context

A transpose today is an editor transaction over every chord (`transposeChords` in `packages/chord-editor/src/chords.ts`), so autosave and undo see it. Chord labels are written in one place, `writeMarkedChord(chord)` in `chord-layer.ts`. The layer's options are fixed when the editor is created. `useSheetKey` (`sheet-title.tsx`) works out the song key from what the editor reports. It also tracks an `original` key, kept as a doc attribute so undo can bring back where "Back" goes. The sheet page already strips `?new` with `history.replaceState`.

## Decisions

### The shown key is chord-layer state, not part of the document

The chord layer holds `{ from, to }` keys, or nothing, in its plugin state. It writes each label as `transposeChord(chord, from, to)`. The editor changes the state with a transaction that only carries meta, so `docChanged` stays false. Autosave, `onChange` and the undo history don't see it.

Why: the stored chords never pass through a mapping and back, so no chord is respelled unless someone edits it.

Alternatives: a doc attribute counts as a change, so autosave and undo would see it. A layer option can't change after the editor is created.

### The distance to the song key is what stays

`useSheetKey` keeps the shown key, or null in the song key. When the song key changes, by "Change" or by a new guess, the shown key moves by the same interval. It is spelled from `keysToMoveTo` for the new mode, as a step would be. "Back" sets it to null. The `original` doc attribute and `firstGuess` go away, because "Back" now always goes to the song key.

### "Make A the song key" is one transaction

The existing `transposeChords` moves the chords and a set key. The same transaction clears the layer's shown key. If the shown key were cleared in a second step, the moved chords would be drawn moved again for a frame.

### The address follows the state, outside the router

Each page reads `?key` once, so the server renders the key button in the shown key: the sheet page through its loader, as it reads `?new`, and `/editor` through `useSearchParams`. After that, the shown key lives in React state. Changes are written with `history.replaceState`, as `?new` is removed. A `key` that doesn't fit is removed the same way when the page loads. A small `readKey` in `chordsheet` reads "F#m" and returns a key only if it is one of `keysToMoveTo` for the song's mode.

Why not `setSearchParams`: a router navigation runs the sheet page's loader again, which reloads the sheet while the editor holds edits.

### The chord input works in the shown key

`SheetEditor` gets the shown key as a prop and passes it to the layer. When the chord input opens, it gets the chord being edited, the sheet's chords and the key, all moved to the shown key. On commit, the chord is moved back with `transposeChord(chord, shown, song)`.

### Read-only sheets keep the key button

`SheetTitle` no longer hides the key button when the sheet is read-only. It disables "Change" and "Make … the song key" instead.

## Risks / Trade-offs

- [A chord edited while transposed is stored in the song key's spelling, which may not be how the person would write it there] → Only the edited chord is affected, and it shows as typed while transposed.
- [The router's location goes stale after `replaceState`] → Nothing reads it after the page loads. `?new` already works this way.
- [Copy and paste inside the editor carries stored chords, not shown ones] → This is intended: pasting into the same sheet keeps them in the song key.

## Migration Plan

None. Stored sheets don't change. The `original` attribute was never stored.

## Open Questions

- If a new guess shouldn't keep the distance (proposal, Open Questions), only "Change" shifts the shown key. The approach stays the same.
