# Design

## Context

The spike lives in `apps/web/app/spike`, about 970 lines. Its parts: the schema (`line` nodes, a `chord` mark that holds the chords on one letter, each with an id), the rescue plugin, the chord commands, the chord layer (labels, spacing and dragging) and a ChordPro reader. The route `spike-editor.tsx` adds chord mode and the chord input. `packages/chordsheet` (M2a) exports TypeScript from source, with `cleanUpSection` and `checkSheet`.

## Goals / Non-Goals

**Goals:**
- An editor package that later steps (sheet editing, chord interactions, publish) extend instead of rewriting.

**Non-Goals:**
- Changing how the rescue rules or the chord layer work. They are ported, not redesigned.

## Decisions

**The package has no React.** `packages/chord-editor` holds the schema, the plugins, the chord commands, the chord layer and the adapter. The React wrapper and the chord input form live in `apps/web`. The package tells the app when to open the input through callbacks, as in the spike. This keeps the package testable with Vitest alone, and usable by a later read-only view. Putting everything in the app was rejected: the adapter and rescue tests belong next to the model.

**The package ships the editor's stylesheet.** The chord layer only works with its layout rules (label positions, line height), so they go with it. Colors, fonts and spacing in that stylesheet are CSS custom properties with defaults. The app sets the values.

**Loading a section.** Each model line becomes a `line` node. A chord at position `i` below the text's length becomes part of the mark on the code unit at `i`. Chords at the text's length go on a trailing space the adapter adds, as in the spike. Each chord gets a new id.

**Handing back a section.** The adapter reads the lines and their chords from the document and drops the ids. If a line ends in a space that carries chords, the space is dropped and its chords get the text's length as their position. Text is normalized to NFC one run at a time between chord positions, so positions stay exact. Then `cleanUpSection` runs, and `checkSheet` checks the result wrapped in a one-section sheet. If problems are left, hand-back fails with them and the draft stays open. That would be a bug, since the editor can't produce line breaks or empty chord text.

**The trailing space is only partly fixed.** The M2a design says the adapter removes the editor's trailing space, which fixes the spike's leftover space. That only works while the space carries chords. Once its chord is deleted, the space looks like one the user typed, and the model keeps those. Removing it in the editor, when the chord is deleted, is M2d's job.

**Keyboard placement.** Ctrl+K or Cmd+K opens the chord input at the caret. If the letter after the caret has no chords, the input adds one. If it has chords, the input edits the first of them. The input offers Delete, and confirming it empty also deletes the chord. Escape closes it and puts the focus back in the lyrics. Clicking a label opens the same input for that chord. The layer's dragging code is not ported; M2d brings it back.

**The test page.** `/section-editor` (noindex) edits the first section of the seed song, which is stored as model JSON in `apps/web`. A **Done** button hands the section back and shows the result as JSON. **Edit** loads the handed-back section again, so a round trip can be tried by hand. What "finishing a section" means in the real app is decided in M2c.

**The spike stays untouched.** The package is a copy, not a move, and the spike keeps its own tests. Making the spike import the package was rejected: it would have to change with every editor step, and it is removed in M2e anyway.

## Risks / Trade-offs

- [The editor is not checked on an iPhone.] → Accepted. M2e is the last chance to check before it is public.
- [The rescue code exists twice until M2e.] → Only the package changes. The spike is frozen.
- [Labels are still placed one frame late.] → Moved to M2d, which reworks the layer's layout.
