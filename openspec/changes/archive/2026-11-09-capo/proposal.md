# Proposal

## Why

Guitarists often play a song with a capo, so they read other chord shapes than the ones that sound (#95). Ultimate Guitar writes its chords as these shapes, so today an import with "Capo: 2nd fret" is stored a tone too low.

## What Changes

- Stored chords are always what sounds. A capo only changes how the sheet is shown, like a transpose, and nothing about it is stored.
- A capo button sits beside the key button. Without a capo it reads "Capo", quietly. With one it reads "Capo 3".
- It opens a list from "No capo" to "Capo 9", each with the shapes for that fret, such as "Capo 3 · G shapes". On a phone the list is a bottom sheet.
- With a capo, the chords show the shapes to play, worked out from the shown key. The chord input shows, takes and suggests shapes, and stores chords moved back.
- With a capo, a transpose keeps the shapes and moves the capo, where the new fret is from 1 to 9. Where it would need fret 10 or 11, the capo stays and the shapes change.
- The capo is in the page's address, as `?capo=3`, next to `?key`, the way the shown key is.
- The Ultimate Guitar import gets a "Written for" field, from "No capo" to "Capo 9". A capo line in the pasted text, such as `Capo: 2nd fret`, `Capo 2` or `Capo: 2`, fills it in, and the person can change it. A fret above 9 gives no capo. The chords are stored moved up to what sounds, and the sheet opens with that capo in the address.
- Not in this change: a capo the sheet suggests, preferred shapes as a setting, and a capo option for photo import. Versions (#116) store the key only, since each player picks their own capo.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `transposition`: the shapes for a capo on a fret.
- `editor-page`: the capo button and its list, a transpose with a capo, the capo in the address, chords edited with a capo, and "Written for" in the Ultimate Guitar import.
- `sheet-page`: the stored sheet has the capo button, and a capo doesn't save.
- `library-page`: the Ultimate Guitar import opens the new sheet with its capo.
- `ultimate-guitar-import`: a `Capo: 2nd fret` line gives the capo the text is written for.

## Impact

- `packages/chordsheet`: the shapes key for a capo, and reading the capo from Ultimate Guitar text.
- `packages/chord-editor`: none expected. The shown-key plugin already draws chords from one key in another.
- `apps/web/app/editor`: a new capo button, `useSheetKey` and `SheetTitle` (`sheet-title.tsx`), the chord input in `sheet-editor.tsx`, and the import form in `import-button.tsx`.
- `apps/web/app/routes`: `sheet.tsx` and `editor.tsx` read `?capo`, and `sheets.tsx` opens an import with it.
- `docs/ui-text.md` gets the capo's words.
- Stored sheets don't change.

## Open Questions

- After the import reads `Capo: 2nd fret`, does that line stay in the sheet as lyrics, or go? For now it stays, as today.
- Does photo import get the same "Written for" field, as its own issue?
