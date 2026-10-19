# Proposal

## Why

The visual chord editor is the riskiest part of Sheet Library. Before we build the real editor in M2, a throwaway spike has to show that chords above the lyrics can stick to their letters, with a natural caret and working undo, on desktop and on phones. See `docs/roadmap.md`, M1.

## What Changes

- A throwaway editor page in `apps/web`, linked from the home page as a prototype. Every pull request's preview link lets us try it on a phone.
- A public-domain seed song with chords to edit.
- Chords shown above their letters and placed by mouse, keyboard and touch. Chords can be edited, moved and deleted.
- The "chords stick to the lyrics" rules, including undo.
- Chords were first built as inline atom nodes in ProseMirror. They hit the stop criteria on Android, so chords are now marks on their letter, drawn in a layer outside the editable text (see design.md).
- A verdict in `docs/`: the chosen approach, results per device, and answers to the open questions. It feeds M2.

Out of scope: the stored model and its adapter, ChordPro, saving, Yjs, chord name checks, transposing, sections, the playing view, cut and paste rules, a "rewrite lyrics" mode, visual polish and phone layout.

## Capabilities

### New Capabilities

- `chord-editor`: editing a chord sheet visually, with chords shown above the lyrics and kept on their letters while the lyrics change.

### Modified Capabilities

None.

## Impact

- `apps/web`: a new route and the ProseMirror packages as dependencies.
- The page goes live on sheetlibrary.com when merged. M2 replaces it.
- `docs/roadmap.md` is updated with the outcome.
