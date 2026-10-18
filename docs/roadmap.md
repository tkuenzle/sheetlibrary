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

- **Visual editor.** Chords appear above the lyrics, and you place them by clicking or tapping. It has to work for musicians who don't know ChordPro.
- **Power users** can get shortcuts later, for example typing `[G` to insert a chord, or a ChordPro source view.
- **Chords stick to the lyrics.** When the letter under a chord is deleted or replaced, the chord moves to the nearest letter (the start of the replacement). It is never silently deleted.
- **Built on ProseMirror (proposed).** It is mature and supports collaboration later (Yjs). The editor model stays separate from the stored model; an adapter converts between them.

### Platform

Already in place, see `openspec/specs/`:

- React Router on Cloudflare Workers.
- OpenTofu for the Cloudflare setup.
- A preview link for every pull request.
- Deploy on merge to `main`.

## Plan

```
M0 walking skeleton  ->  M1 editor spike  ->  M2 published editor  ->  later
       done
```

**M0: Walking skeleton (done).** The full path from a pull request to sheetlibrary.com, with checks, previews and infrastructure in code.

**M1: Editor spike.** A throwaway prototype that answers the risky questions:

- Chords above letters, including chords wider than the lyrics under them.
- Natural caret, selection and backspace around chords.
- The "chords stick to the lyrics" rule, including undo.
- Placing chords by mouse, keyboard and touch.

**M2: Published editor.** The chord sheet model (with ChordPro import and export) and the real editor. Published as a static page with an editable public-domain seed song. No backend and no saving.

**Later, roughly in this order:**

- Storing sheets: accounts and a backend. Possibly local-first, so sheets work offline on stage.
- The library: browse, search, collections and ordered sets for gigs and rehearsals.
- Importing "chords over lyrics" text, the format most existing sheets use.
- Transposing, capo, and a clean view for playing and printing.
- Real sheet music (for example MusicXML).

## Open questions

- Several chords end up on the same letter after a deletion: keep all of them, the first, or the last?
- Autosave in the browser and ChordPro export already in M2?
- How important are phones for M2?
- Local-first or a classic backend?
- Preview links: public or protected?
