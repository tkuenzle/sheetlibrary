# Design

## Context

`apps/web` is React Router on Cloudflare Workers with server rendering. It has one route and no editor code yet. ProseMirror needs the browser DOM, so the editor can only start on the client. Vitest runs without a DOM, and Playwright only runs desktop Chrome.

## Goals / Non-Goals

**Goals:**
- A verdict on the chord representation, backed by tests and a device checklist.
- A list of edge cases that M2 can turn into acceptance tests.

**Non-Goals:**
- Code that survives into M2. The rescue logic and its tests may be reused, but nothing is built for reuse.
- Collaboration. We only avoid choices that would rule out Yjs later.

## Decisions

**Plain ProseMirror, not Tiptap.** Everything we test happens at the ProseMirror level: transactions, position mapping, history, node views and reading changes from the DOM. Tiptap would add a layer to debug through, and the verdict should be about ProseMirror itself.

**Chords as marks on their letter.** A chord is a mark on the letter it sits on, like bold, but holding the chord's text. Chords piled on one letter are one mark holding a list. The mark doesn't spread to typed text. Marks move with the text, undo covers them, copied text carries them, and Yjs supports them. A chord after the last letter of a line sits on a trailing space the editor adds. A chord on a space between words means "after the text before it". In M2 the next word should start after such a chord's label; the chord layer can do that by widening the space, as it already does for wide chords. Alternatives:
- *Inline atom nodes*: built first. On Android both stop criteria failed: keyboard suggestions contained chord names, and the caret couldn't cross a chord. Results in `docs/editor-spike.md`.
- *Positions stored on the line*: every edit has to recompute them, and edits by two people at once don't merge. Dropped.

**Rescue after each edit.** A plugin checks every transaction for chords that disappeared with their letter:
- Chords deleted with the chord controls carry a flag and stay deleted.
- Chords whose whole line is gone, with both its start and its end inside the deleted range, stay deleted.
- All other chords are put back on the letter at their old position mapped through the edit, leaning left, so they land on the start of any inserted text. Chords landing on the same letter keep their original order.

The plugin adds its steps to the same transaction group, so the history plugin undoes the edit and the rescue in one step.

**No typo rule.** When a deletion moves a chord to the next letter, it stays there, even if the deleted letter is typed again. A rule that moved the chord onto retyped text was built and dropped. It only helps when one letter is deleted and retyped, the user can't see it, and phone keyboards that replace whole words skip it. Replacing a selected letter already keeps the chord on the new letter, and a misplaced chord is quick to drag back.

**Caret.** Marks add no positions, so the browser's own caret, arrow keys and Delete are kept. The caret plugin and key handling from the atom version go away.

**Chord display: a layer outside the editable text.** Chord labels are real elements in a separate layer over the editor, placed above the coordinates of their letter after each render. The editable text holds only letters, so phone keyboards never see chords. Where a label would overlap the next one, the marked letter gets extra space in front of it; those spans stay editable. The layer also makes later interactions possible without touching the text: dragging chords, a hover icon on desktop, tapping above a word on phones.

**Placing chords.**
- *Chord mode*: a toggle in which the lyrics can't be edited. A click or tap on a letter opens a small chord input for that letter. No on-screen keyboard pops up for the lyrics, and phone keyboards never touch chord editing.
- *Keyboard*: in text mode, a shortcut opens the chord input at the caret.
- *Editing a chord*: in chord mode, tapping a chord selects it. The user can then change its text, delete it, or tap another letter to move it there.
- *Dragging a chord*: in both modes, a chord can be dragged by mouse or touch. A caret shows where it will land, and releasing moves it there. This is a rough check that the layer works for dragging, not the final design. The hover icon on desktop and tapping above a word on phones are left for M2.

**Route.** `/spike/editor`, linked from the home page as a prototype. The editor starts in an effect on the client; the server renders only an empty frame. The seed song is "Amazing Grace" with chords. M2 deletes the route.

**Testing.**
- The rescue and undo rules work on editor state alone, without a DOM, so each spec scenario gets a Vitest test.
- Display, caret and phone keyboards are checked by hand on the preview link, on five targets: Chrome, Safari and Firefox on desktop, Safari on an iPhone, and Chrome with Gboard on Android.

## Risks / Trade-offs

- [Phone keyboards may still trip over the mark spans, for example the extra space in front of a wide chord.] → Rerun the Android checks first.
- [The chord layer drifts from the text after layout changes, such as wrapping, resizing or loading fonts.] → Reposition on every update and on resize.
- [A touch drag competes with scrolling and text selection.] → Start dragging only on the label itself, and check on Android.
- [Measuring chord labels after each render can flicker or be slow on long songs.] → Fall back to always reserving the label's width.

**Stop criteria.** Atom nodes failed both of these on Android. Marks must pass them:
- Typing inside a word with a chord, with a phone keyboard, moves or garbles the chord.
- Chords add caret stops a user can notice on any of the five targets.
