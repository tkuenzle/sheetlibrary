# Roadmap

Where Sheet Library is heading and the ideas behind it. This is a rough plan, not a commitment. Detailed plans live in OpenSpec changes (`openspec/`).

## Ideas

### A sheet is separate from its format

A sheet in the library has the same shape whatever its content:

```
Sheet
  id, title, artist, key, capo, tempo, tags, ...
  content: { format: "chordsheet", ... }   <- first
           { format: "musicxml", ... }     <- later, real notation
```

Library features (search, collections, sets, sharing) only use the outer part. Each format brings its own model and editor. Chord sheets and real notation are too different to share one model.

### Chord sheets

- **Source of truth:** our own versioned JSON model in `packages/chordsheet`, not ChordPro text. The editor is visual, so nobody writes ChordPro by hand. The model holds only the content: sections, each a group of lines. Metadata such as the title belongs to the sheet around it and comes with storage.
- **Import and export formats** such as ChordPro are views of the model. The model leads, so they may lose data: import drops what the model doesn't hold yet, and export drops or replaces what the format can't write. ChordPro comes first; more formats follow.
- **Chords** are stored per line as positions in the lyrics (`{ at, chord }`), as the text the user typed (for example `Bb` or `A#`). They are only parsed when needed, for example for transposing.
- **No empty lines.** A line has a chord or a character that isn't a space. Sections take the place of blank lines.

### The editor

- **Visual editor.** Chords appear above the lyrics, and you place and move them directly, for example by dragging them. It has to work for musicians who don't know ChordPro.
- **Power users** can get shortcuts later, for example typing `[G` to insert a chord, or a ChordPro source view.
- **Chords stick to the lyrics.** When the letter under a chord is deleted or replaced, the chord moves to the nearest letter (the start of the replacement). It is never silently deleted, except together with its whole line. Several chords on one letter are all kept, in order. A chord can also sit on a space, meaning "after the text before it".
- **Built on ProseMirror.** The editor spike (M1) confirmed it: chords are marks on their letter, drawn in a layer above the editable text. It is mature and supports collaboration later (Yjs). The editor model stays separate from the stored model; an adapter converts between them.
- **One section at a time.** The whole sheet is one editor document, but the user edits one section at a time: the one with the caret. Other sections are dimmed. The active section is a draft that may break the model's rules while the user types, for example with an empty line. When the caret leaves it, it is cleaned up.
- **A blank line is a section break**, whether typed or pasted. Backspace at the start of a section joins it with the one before. Undo works across sections.

### Platform

Already in place, see `openspec/specs/`:

- React Router on Cloudflare Workers.
- OpenTofu for the Cloudflare setup.
- A preview link for every pull request.
- Deploy on merge to `main`.

## Plan

```
M0 walking skeleton  ->  M1 editor spike  ->  M2 published editor  ->  later
       done                    done
```

**M0: Walking skeleton (done).** The full path from a pull request to sheetlibrary.com, with checks, previews and infrastructure in code.

**M1: Editor spike (done).** A throwaway prototype that answered the risky questions below. The verdict is in `docs/editor-spike.md`.

- Chords above letters, including chords wider than the lyrics under them.
- Natural caret, selection and backspace around chords.
- The "chords stick to the lyrics" rule, including undo.
- Placing chords by mouse, keyboard and touch.

**M2: Published editor.** The chord sheet model and the real editor. Published as a static page with an editable public-domain seed song. No backend and no saving.

M2 is built in small steps, each with its own OpenSpec change and pull request. The editor was not checked on an iPhone before building on it (marks were only tested on Android). That risk is accepted.

1. **M2a: Chord sheet model (done).** The versioned JSON model for the content (sections of lines, no metadata), its rules and a check, and a clean-up step for a section. No UI. See `openspec/specs/chord-sheet-model`. From the spike: several chords at one spot keep their order, and a chord can sit at the end of a line or on a space.
2. **M2b: Section editor (done).** The real editor for one section, in `packages/chord-editor`, built the way the spike works: marks, the chord layer, and the rescue rules with their tests. An adapter loads a section from the model and hands it back cleaned up and checked. Chords are added and edited by keyboard (Ctrl+K or Cmd+K) and by clicking their label.
3. **M2c: Sheet editing (done).** Editing a whole sheet in one editor, one active section at a time: finishing a section when the caret leaves it, blank lines as section breaks (typed or pasted), joining sections, and undo across sections. A test page at `/sheet-editor`.
4. **M2d: Chord interactions.** In four changes:
   - **chord-drag (done):** Dragging a chord to move it, inside the active section, including to a spot in a pile. The page scrolls while dragging near the window's edge.
   - **chord-layout (done):** A pile, or a chord on a space, pushes the text after it past its labels, with a dash in a split word. Clean-up trims spaces at both ends of a line and collapses double spaces, which fixes the trailing space left after removing a chord at the end of a line. Labels are placed in the same frame as the change.
   - **touch-drag (done):** A chord dragged with a finger lifts about 1.5 lines above it, so the label and the drop caret under it can be seen. The chord lands under the label, not under the finger. Scrolling up follows the label. Tried on Android; a loupe was the alternative.
   - **chord-add:** Adding chords by pointer: an add icon on hover on desktop, maybe tapping above a word on phones, and dragging.
5. **M2e: Section operations.** Dragging sections to reorder them. Until then, a section is moved by cut and paste.
6. **M2f: Publish.** The editor page with the seed song replaces `/spike/editor`.
7. **M2g: UI polish.** A design foundation: tokens for color, type and spacing, a few base components, and a glossary and voice for the UI text. Until then, pages stay plain, with colors, fonts and spacing in CSS custom properties so this step changes values, not structure.

**Later, roughly in this order:**

- ChordPro import and export: a common interface for formats, with ChordPro first and its output checked against an independent parser. Possibly still in M2 (see the open questions); M2b doesn't need it, since the seed song can be stored as model JSON.
- Storing sheets: accounts and a backend. Possibly local-first, so sheets work offline on stage.
- The library: browse, search, collections and ordered sets for gigs and rehearsals.
- Importing "chords over lyrics" text, the format most existing sheets use.
- Transposing, capo, and a clean view for playing and printing.
- Real sheet music (for example MusicXML).

## Open questions

- Autosave in the browser and ChordPro export already in M2?
- How important are phones for M2? The spike shows they work well, especially with dragging.
- What does the sheet around the content hold (title, artist, key), and what do sections need besides their lines (verse, chorus, a label)?
- Is chord mode still needed once chords can be dragged, and added by hover or tap?
- Local-first or a classic backend?
- Preview links: public or protected?
