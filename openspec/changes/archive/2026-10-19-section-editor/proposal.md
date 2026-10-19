# Proposal

## Why

The editor spike (M1) proved the approach, but it is throwaway code that reads ChordPro straight into ProseMirror and has no link to the chord sheet model (M2a). The real editor has to edit the model. This is M2b in `docs/roadmap.md`: the editor for one section, the step every later editor change builds on.

## What Changes

- A new package, `packages/chord-editor`, ported from the spike: the ProseMirror schema, chords as marks, the chord layer and the rescue rules, with the rescue tests.
- An adapter that loads one model section into the editor and hands it back. Hand-back cleans up the section and checks it with the model.
- Chords are placed by keyboard: Ctrl+K or Cmd+K adds or edits a chord at the caret, and a chord can be deleted. Clicking a chord's label edits it. No chord mode and no dragging; those wait for M2d.
- In `apps/web`: a React wrapper and a test page that edits one section of the seed song, stored as model JSON. Playwright tests cover the chord layer.
- Colors, fonts and spacing go in CSS custom properties, so the UI polish (M2f) changes values, not structure.
- `docs/roadmap.md`: the iPhone check is dropped as a step, and the risk is accepted without it. M2 is renumbered: b section editor, c sheet editing, d chord interactions, e publish, f UI polish. Both rough edges from the spike (a trailing space left after removing an end-of-line chord, labels placed one frame late) move to M2d.

Out of scope: sheet editing (switching, adding and reordering sections, undo across sections, pasting text with blank lines), which is M2c. The spike's ChordPro reader. `/spike/editor` stays as it is until M2e replaces it.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `chord-editor`: placing chords narrows to keyboard and clicking a label (no tap to place, no moving), and the editor now edits one section of the model.

## Impact

- New package `packages/chord-editor`, depending on `chordsheet` and the ProseMirror packages. It is picked up by the `packages/*` workspace entry, the `just` recipes and CI.
- `apps/web`: new test page and route, a React wrapper, Playwright tests. The spike is not changed.
- The editor has not been checked on an iPhone. That risk is accepted.

## Open Questions

- Phones can't add chords in M2b, since there is no Ctrl+K. Add a button that does the same, or wait for M2d?
- When the letter at the caret already has chords, Ctrl+K edits one of them. How does a keyboard user add another chord to that letter?
- A chord between a letter and a combining accent, or inside an emoji (a surrogate pair): where does hand-back put it?
- Should the test page be linked from the home page, or only reachable by its URL?
