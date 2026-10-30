# Proposal

## Why

"Killing Me Softly" on Ultimate Guitar uses `Fadd#11`. The chord grammar can't read it, so the chord input refuses it and the import (#47) reads the whole chord line as lyrics. `Cadd4` and `Cadd13` fail the same way (#61).

## What Changes

- `add#11` is a new added note, written after `add9` and `add11`. `Fadd#11`, `F(#11)` and `Fm#11` are stored as `add#11` and `madd#11`. A `#11` without a sixth or seventh can't be written as an alteration: `F#11` would read back as an F♯ chord.
- With a sixth or seventh, `add#11` is the `#11` alteration: `C7add#11` is `C7#11`, `C6add#11` is `C6#11`. This matches `C7add9`, which is `C9`.
- `add4` is read as `add11`, and `add#4` as `add#11`. Added notes keep the 9 and 11 names on a triad, as `C2` is already `Cadd9`.
- `add13` is read as a 6 when there is no sixth or seventh, so `Cadd13` is `C6` and `Cmadd13` is `Cm6`. With a seventh it is the 13 extension, so `C7add13` is `C13`, as `C7(13)` is today, and `C9add13` and `C11add13` are `C13` too. `C6add13` and `C13add13` are not chords.

`C(b5)` is not part of this change. It has no canonical form without brackets and is parked as #63.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `chord-symbols`: a new requirement for added notes: `add#11`, the `add4`, `add#4` and `add13` spellings, and when an added note becomes a sixth, an alteration or an extension.

## Impact

- `packages/chordsheet/src/chord-symbol.ts`: the added-note slot and the one-form rules.
- `packages/chordsheet`: tests for the reader, and an Ultimate Guitar chord line with `Fadd#11`.
- The chord input, the import and the model check use `readChord`, so they accept the new chords without changes of their own.
