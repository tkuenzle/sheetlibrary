# Proposal

## Why

Musicians play a song in the key that fits the singer. Chords are parsed since `chord-parsing`, so a sheet can now be moved to another key, with each chord spelled as the new key spells it. This is the core of M3, "Songs in any key".

## What Changes

- A key button sits beside the sheet's title on `/editor`, such as "Key G". On a phone it sits beside the title too.
- The key is guessed from the sheet's chords. Sheets don't store a key yet (#58), so the guess is made again after every edit. It keeps the sheet's own spelling: a sheet written with G#, C# and D# is in G#, not Ab.
- The button opens a popover, a bottom sheet on a phone. It lists the keys to transpose to, then has a step down and a step up by one semitone. The current key is ringed. The popover names the sheet's original key, the one guessed when it was loaded, and says it was guessed.
- Only keys worth writing in are listed: for each pitch, the spelling with fewer sharps or flats, so Db, not C#, and B, not Cb. A minor sheet lists minor keys, which have their own spellings: C#m, G#m and Bbm. Where both spellings are equally good, both show in one split cell: F# or Gb, and D#m or Ebm. Steps land on F# and Ebm.
- Picking a key, or a step, changes all chords right away. Roots and basses are spelled in the new key: in F, `Bb`, not `A#`. Suffixes stay.
- Picking the ringed key when the sheet is spelled another way respells it without moving it: G# becomes Ab.
- The popover stays open after a pick or a step, so the next one is one click away. Escape, a click outside or the key button closes it.
- A transpose is one step to undo. Ctrl Z and ⌘ Z also undo while the popover is open. "Back to G" moves the sheet to its original key. It is always shown, and disabled in the original key, so the popover doesn't change size. Once sheets store a key (#58), that key is the original one.
- A sheet without chords has no key, and the key button is hidden.
- The `chord-editor` package gets a command that transposes every chord in one transaction. The app holds the words.
- On a phone, the bottom sheet slides in and slides out.

Keys stored on the sheet, keys per section and transposing one section are #58. A capo setting is not part of this change.

The mockups are on the "Transpose" page of the design canvas. Their spacing is too tight; it is loosened when this is built.

## Capabilities

### New Capabilities

- `transposition`: guessing a sheet's key, the keys a sheet can move to and their spelling, and moving chords from one key to another.

### Modified Capabilities

- `editor-page`: the key button beside the title, and the popover that transposes the sheet.

## Impact

- `packages/chordsheet`: keys, the key guess, the key lists and transposing a chord.
- `packages/chord-editor`: a command that transposes every chord, and a way for the app to read the chords.
- `apps/web`: the key button, the popover and bottom sheet, its styles.
- `apps/web/e2e`: tests for transposing.
- `docs/ui-text.md`: the words for the key button and the popover.

## Open Questions

- A chord outside the key, such as F in G, moves with the song and becomes G in A. Is that right for every chord?
