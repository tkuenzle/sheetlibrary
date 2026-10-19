# Proposal

## Why

The editor spike (M1) has no stored model. It turns ChordPro text straight into a ProseMirror document. Before the real editor (M2b) and saving can be built, a chord sheet needs its own data shape that the app owns and can version. This is M2a in `docs/roadmap.md`.

## What Changes

- A new package, `packages/chordsheet`, with no UI and no dependencies on the app.
- A versioned JSON model for chord sheet content: sections, each made of lines, each line with its text and its chords. Chords are stored as positions in the line text and as the text the user typed.
- Model rules, and a function that checks a sheet against them. A line must have at least one chord or one non-space character.
- A clean-up step for one section, which drops empty lines. The editor will edit one section at a time and call it when the user finishes a section (built in M2b, not here).

Out of scope: ChordPro import and export (a separate change, `chordpro-format`), metadata (title, artist, key and so on), section kinds and labels, parsing chords, transposing, the editor and its adapter, saving. The spike stays as it is.

## Capabilities

### New Capabilities

- `chord-sheet-model`: the stored shape of chord sheet content and its rules.

### Modified Capabilities

None.

## Impact

- New package `packages/chordsheet`, picked up by the existing `packages/*` workspace entry, the `just` recipes and CI.
- No change to `apps/web`.
- `docs/roadmap.md` is updated with the decisions.

## Open Questions

- Can the clean-up step fix anything besides empty lines, such as empty chord text, or does it only report it?
