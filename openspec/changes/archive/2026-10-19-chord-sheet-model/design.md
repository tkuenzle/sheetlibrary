# Design

## Context

The spike's `apps/web/app/spike/chordpro.ts` reads ChordPro straight into ProseMirror, with chords as marks on their letter and a trailing space for chords after the last letter. The workspace already includes `packages/*`, and the `just` recipes run each package's `test` and `typecheck` scripts.

## Goals / Non-Goals

**Goals:**
- A model that M2b can map to and from the editor through an adapter.
- Changes to the shape later go through a new version, not a silent change.

**Non-Goals:**
- Migrations. There is only version 1.
- Anything the editor needs only while typing, such as chord ids or trailing spaces.

## Decisions

**Chords stay text.** Transposing only needs the root and the bass note, for example "Bb" and "D" in "Bbmaj7/D". A small parser can find them when transposing is built, and leave text it can't read alone. Storing parsed chords would lose the user's spelling (`A#` vs `Bb`), force one notation early (German `H`, Nashville numbers), and still need a fallback for text like "N.C.". Moving to parsed chords later is one migration that uses the same parser.

**Positions count UTF-16 code units, text is NFC.** This matches JS string indices and ProseMirror positions inside a text node, so the adapter needs no conversion. Code points would need conversions everywhere. Grapheme clusters can change between Unicode versions, so stored positions could change meaning. NFC makes "é" one unit, so a chord can't land between a letter and its accent. Whatever writes text into a sheet, such as the editor's adapter or an import, normalizes it.

**Content only, no metadata.** Title, artist and key belong to the sheet around the content (see `docs/roadmap.md`). They are added with storage, when the library shows what it needs. `key` waits for transposing, which decides what it means.

**Sections are objects.** A section is `{ lines }`, not a bare list of lines, so a kind or label can be added later without a migration.

**Text is kept as typed.** Spaces at the start or end of a line and inside chord text are kept. A sheet with no sections is valid, for example a new empty sheet.

**A chord after the last letter has no trailing space.** Its position is the text's length. The adapter adds the editor's trailing space and removes it again. This also fixes the spike's leftover space when such a chord is removed.

**Chords have no ids in storage.** The editor uses ids only to tell a moved chord from a deleted one. The adapter creates new ids on load.

**Editing one section at a time.** The editor works on a draft of one section, which may break the rules while the user types. When the user finishes the section, the clean-up step drops empty lines and the check reports anything left. The model never has to allow states that only exist while typing. This shapes M2b, which also has to answer undo across sections and pasting text with blank lines.

**A hand-written check, no schema library.** Most rules, such as sort order, surrogate pairs and "a chord or a non-space character", can't be written as a schema anyway. The check returns a list of problems, each with the section, line and chord it concerns, instead of stopping at the first.

**The package is used from source.** `packages/chordsheet` exports TypeScript directly, with no build step. Its own `test` and `typecheck` scripts plug it into `just check`.

## Risks / Trade-offs

- [Other languages count positions differently, for example Python counts code points.] → The model documents that positions are UTF-16 code units.
