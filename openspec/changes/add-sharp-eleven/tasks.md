# Tasks

## 1. Reading the new added notes

- [x] 1.1 In `packages/chordsheet/src/chord-symbol.ts`, add `add#11` to the added notes after `add11`, with `add#4` as its alias, and `add4` as an alias of `add11`. In the one-form rules, turn a `#11` alteration on a chord with no sixth or seventh into `add#11`, and an `add#11` on a chord with a sixth or seventh into the `#11` alteration. Verify with unit tests in `chord-symbol.test.ts` for the scenarios of "Sharp eleven as an added note" and "Added notes on a triad", and that `C7#11add#11` is not a chord
- [x] 1.2 Read `add13` as an added note and resolve it in the one-form rules: a 6 when there is no sixth or seventh, the 13 extension with a seventh (replacing a 9 or 11 extension), not a chord with a 6 or a 13. Do it after the dim and power-chord checks, so `Cdimadd13` stays refused. Verify with unit tests for the scenarios of "Added thirteenth" and for `Cdimadd13`
- [x] 1.3 Add `Fadd#11`, `F(#11)`, `Cadd4` and `Cadd13` to the Ultimate Guitar list in `chord-symbol.test.ts`, so they are checked to read back as the same chord, and verify with `just test`

## 2. The import

- [x] 2.1 Add a test to `ultimate-guitar.test.ts` where a chord line with `Fadd#11` becomes chords on the line below it, and verify with `just test`

## Workflow follow-up

- Update issue #61 with the decisions: `add#11` as the canonical form, `add#4` and `add4` as aliases, `add13` read as a 6 or a 13, `C(b5)` parked as #63.
- Archive the change after review.
