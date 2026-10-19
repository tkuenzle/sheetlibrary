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

- **Source of truth (proposed):** our own versioned JSON model, not ChordPro text. The editor is visual, so nobody writes ChordPro by hand.
- **ChordPro** is a first-class import and export format, with round-trip tests.
- **Chords** are stored per line as positions in the lyrics (`{ at, chord }`), as the text the user typed (for example `Bb` or `A#`). They are only parsed when needed, for example for transposing.

### The editor

- **Visual editor.** Chords appear above the lyrics, and you place and move them directly, for example by dragging them. It has to work for musicians who don't know ChordPro.
- **Power users** can get shortcuts later, for example typing `[G` to insert a chord, or a ChordPro source view.
- **Chords stick to the lyrics.** When the letter under a chord is deleted or replaced, the chord moves to the nearest letter (the start of the replacement). It is never silently deleted, except together with its whole line. Several chords on one letter are all kept, in order. A chord can also sit on a space, meaning "after the text before it".
- **Built on ProseMirror.** The editor spike (M1) confirmed it: chords are marks on their letter, drawn in a layer above the editable text. It is mature and supports collaboration later (Yjs). The editor model stays separate from the stored model; an adapter converts between them.

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

**M2: Published editor.** The chord sheet model (with ChordPro import and export) and the real editor. Published as a static page with an editable public-domain seed song. No backend and no saving.

M2 is built in small steps. Each step after the iPhone check gets its own OpenSpec change and pull request:

1. **iPhone check.** Run the stop-criteria and drag rows of the checklist in `docs/editor-spike.md` on an iPhone. Marks were only tested on Android, and this is the one risk that could still change the approach.
2. **M2a: Chord sheet model.** The versioned JSON model with ChordPro import and export, and round-trip tests. No UI. From the spike: several chords at one spot keep their order, and a chord can sit at the end of a line or on a space.
3. **M2b: Real editor.** Built on the model the way the spike works: marks, the chord layer, and the rescue rules with their tests. An adapter converts between the editor and the model. Fixes the spike's rough edges (trailing space left behind, labels placed one frame late).
4. **M2c: Chord interactions.** Dragging to move and add chords, an add icon on hover on desktop, maybe tapping above a word on phones. A chord on a space pushes the next word past its label. Can run alongside M2b.
5. **M2d: Publish.** The editor page with the seed song replaces `/spike/editor`.

**Later, roughly in this order:**

- Storing sheets: accounts and a backend. Possibly local-first, so sheets work offline on stage.
- The library: browse, search, collections and ordered sets for gigs and rehearsals.
- Importing "chords over lyrics" text, the format most existing sheets use.
- Transposing, capo, and a clean view for playing and printing.
- Real sheet music (for example MusicXML).

## Open questions

- Autosave in the browser and ChordPro export already in M2?
- How important are phones for M2? The spike shows they work well, especially with dragging.
- Song sections and metadata (title, artist, key, verse, chorus): what does the model keep, so a ChordPro round trip loses nothing?
- Is chord mode still needed once chords can be dragged, and added by hover or tap?
- Local-first or a classic backend?
- Preview links: public or protected?
