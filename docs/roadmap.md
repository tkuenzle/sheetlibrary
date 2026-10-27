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
- **Adding to a pile by keyboard** has no way yet: Ctrl+K or Cmd+K edits a letter's first chord. An "Add after" button in the chord input could do it. Mouse and touch already add after a letter's chords.
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
       done                    done                  done
```

**M0: Walking skeleton (done).** The full path from a pull request to sheetlibrary.com, with checks, previews and infrastructure in code.

**M1: Editor spike (done).** A throwaway prototype that answered the risky questions below. The verdict is in `docs/editor-spike.md`.

- Chords above letters, including chords wider than the lyrics under them.
- Natural caret, selection and backspace around chords.
- The "chords stick to the lyrics" rule, including undo.
- Placing chords by mouse, keyboard and touch.

**M2: Published editor (done).** The chord sheet model and the real editor. Published as a static page with an editable public-domain seed song. No backend and no saving.

M2 is built in small steps, each with its own OpenSpec change and pull request. The editor was built without checking it on an iPhone; it was tried on Android. In M2f it was tried in the iOS Simulator, but still not on a real iPhone.

1. **M2a: Chord sheet model (done).** The versioned JSON model for the content (sections of lines, no metadata), its rules and a check, and a clean-up step for a section. No UI. See `openspec/specs/chord-sheet-model`. From the spike: several chords at one spot keep their order, and a chord can sit at the end of a line or on a space.
2. **M2b: Section editor (done).** The real editor for one section, in `packages/chord-editor`, built the way the spike works: marks, the chord layer, and the rescue rules with their tests. An adapter loads a section from the model and hands it back cleaned up and checked. Chords are added and edited by keyboard (Ctrl+K or Cmd+K) and by clicking their label.
3. **M2c: Sheet editing (done).** Editing a whole sheet in one editor, one active section at a time: finishing a section when the caret leaves it, blank lines as section breaks (typed or pasted), joining sections, and undo across sections. A test page at `/sheet-editor`.
4. **M2d: Chord interactions (done).** In five changes:
   - **chord-drag (done):** Dragging a chord to move it, inside the active section, including to a spot in a pile. The page scrolls while dragging near the window's edge.
   - **chord-layout (done):** A pile, or a chord on a space, pushes the text after it past its labels, with a dash in a split word. Clean-up trims spaces at both ends of a line and collapses double spaces, which fixes the trailing space left after removing a chord at the end of a line. Labels are placed in the same frame as the change.
   - **touch-drag (done):** A chord dragged with a finger lifts about 1.5 lines above it, so the label and the drop caret under it can be seen. The chord lands under the label, not under the finger. Scrolling up follows the label. Tried on Android; a loupe was the alternative.
   - **chord-add (done):** Adding chords by mouse. Below the lyrics of the active section, a caret in front of the letter and a "+" under it show where a click adds a chord. Below the lyrics, the "+" never overlaps labels, and on a letter with chords it adds after them. The active section has a bit more line height to make room.
   - **touch-add (done):** Adding chords on phones. The native caret, with its magnifier, picks the letter. After a tap, a "+ Chord" button shows above the caret, where chords go, and opens the chord input. It shows once the caret has stopped moving and the finger is lifted, so it doesn't flicker or get in the way while the caret is dragged. On a letter with chords it adds after them. Tried on Android, and in M2f in the iOS Simulator. M2e later moved the button into the section toolbar, so it no longer floats at the caret.
5. **M2e: Section operations (done).** The active section has a toolbar with "+ Chord", "move up" and "move down". With a mouse, it sits above the section; on a touch device, it is docked at the bottom of the visible area, above the keyboard. Dragging a section was the plan, but on a phone a section is often taller than the screen and hides the spots to drop it. The toolbar also replaced touch-add's floating "+ Chord", which collided with the move buttons. Pressing a move button again moves the section further.
6. **M2f: Publish (done).** The editor with the seed song is at `/editor`, linked from the home page. It says it is a prototype and nothing is saved; a reload starts over. The spike and the `/sheet-editor` test page are gone. The editor's e2e tests run on a harness page that is never deployed. The editor was tried in the iOS Simulator instead of on an iPhone, since none was at hand; a real iPhone is still untested.
7. **M2g: UI polish (done).** A facelift, not just new values: the layout, the toolbar and the buttons change too. The mockups are in a design canvas on claude.ai, the source for layout and looks; see `docs/design-direction.md`. The words are in `docs/ui-text.md`. In five changes:
   - **ui-direction (done):** The direction and the mockups, with no code. Workbench, styled after Material 3 Expressive: the section's tools beside the section, a side panel for help, role tokens with a light and a dark ("lamplight") style.
   - **ui-foundation (done):** The role tokens, the font and the icons, and the base components built from them: button, icon button, tooltip, toolbar, popover and note. They are React components with plain CSS, so the app's design system stays out of the `chord-editor` package. The font is served from our own site: it decides where chords sit, so it only changes with a commit, and it works offline. Icons are inline SVGs, only the ones we use. A `/design` page shows the components in both styles, only in previews and the dev server. The existing pages took on the tokens and the font, but not the new layout. The chord layer now places its labels again when the font loads.
   - **editor-facelift (done):** The editor in the new look. The active section is a sheet on the page, the others are dimmed by color, and each section has a numbered badge, read as "Section 2". The selected and the dragged chord are pills. The section toolbar is a React component in the app, beside the section, and it follows the scroll in a tall section. On touch, or in a window too narrow for it, it is docked at the bottom. Its move buttons use "move" icons, and docked they sit next to the word "Move": plain arrows next to a "2 of 2" read as stepping through the sections. The `chord-editor` package only places the toolbar, and tells the app what it shows and where to open the chord input. It keeps the layout it measures and publishes state classes and data attributes. The app styles them with the role tokens. Reduced motion and forced colors are supported. Tried in Chromium on desktop, tablet and phone sizes; Safari is still untested.
   - **page-shell (done):** The top bar, the side panel and the home page. The top bar has the site's name, linking home, and the song's title. In a window at least 1024px wide, the side panel with the prototype notice and the help sits beside the editor and stays in view; in a narrower one, a help button opens it as a modal sheet, and the notice moves above the song. The help shows touch or mouse use, after the main pointer. Leaving the editor with edits asks first, with the browser's own prompt. All layout rules use one set of widths: phone up to 640px, middle up to 1023px, wide from 1024px. The home page's sample sheet is static markup for now.
   - **ui-text (done):** A voice and a glossary for the UI text, in `docs/ui-text.md`. The voice is plain and short, without "we", "please" or "you can". The UI says sheet, cursor and edit, and the chord input has Done, Remove and Cancel. For words, the doc wins over the canvas, whose text is no longer kept up to date, and the mockup copies in the repo are gone. The section badge's word moved from `chord-editor` to the app. The badge now shows in Firefox too, where it had been missing since editor-facelift; Firefox reads it as only the number. WebKit is still untested.

**Later, roughly in this order:**

- ChordPro import and export: a common interface for formats, with ChordPro first and its output checked against an independent parser. Possibly still in M2 (see the open questions); M2b doesn't need it, since the seed song can be stored as model JSON.
- Storing sheets: accounts and a backend. Possibly local-first, so sheets work offline on stage.
- The library: browse, search, collections and ordered sets for gigs and rehearsals.
- Importing "chords over lyrics" text, the format most existing sheets use.
- Transposing, capo, and a clean view for playing and printing.
- Real sheet music (for example MusicXML).
- Keyboard shortcuts, planned together: adding chords, adding to a pile, and moving sections.
- Dragging sections, if moving them with buttons turns out to be too slow.
- A new UX for the chord input. M2g only restyles it.
- A real logo. M2g uses the name in the chosen font as a placeholder.
- A read-only sheet view in `chord-editor`, for the home page's sample sheet and later for library previews and the play view, so they can't drift from the editor's layout ([#23](https://github.com/tkuenzle/sheetlibrary/issues/23)).

## Open questions

- Autosave in the browser and ChordPro export already in M2?
- How important are phones for M2? The spike shows they work well, especially with dragging.
- What does the sheet around the content hold (title, artist, key), and what do sections need besides their lines (verse, chorus, a label)?
- Is chord mode still needed once chords can be dragged, and added by hover or tap?
- Local-first or a classic backend?
- Preview links: public or protected?
