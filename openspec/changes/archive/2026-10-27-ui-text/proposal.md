# Proposal

## Why

The UI text was copied from the mockups, where it was written as a placeholder while the layout was drawn. It mixes words for the same thing ("edit" and "change", "song" and "sheet"), uses editor jargon ("caret"), and the boards disagree with each other. This is M2g's last step: a voice and a glossary for the UI text, and the text rewritten to follow them.

## What Changes

- A new `docs/ui-text.md` with the voice and the glossary.
- The voice is plain: everyday words, short labels (verb and noun), help lines without a period, imperative, calm and honest. No "we", "please", "you can" or exclamation marks.
- The glossary: **sheet** for what the library holds (not "song"), **section**, **lyrics**, **letter** for one spot in the lyrics, **cursor** (not "caret"), and **edit** for both sections and chords (not "change"). The chord input's buttons are **Done**, **Remove** and **Cancel**. The toolbar's names and the key names stay as they are.
- The app's text is rewritten to follow it: the help, the chord input, the prototype note and the home page.
- The section badge's word, "Section", moves from the `chord-editor` package to the app, so the package holds no UI text.
- For wording, `docs/ui-text.md` wins over the design canvas. The canvas stays the source for layout and looks; its text is no longer kept up to date.
- `docs/design/` is deleted, as planned for M2g's last step.

## Capabilities

### New Capabilities

- `ui-text`: the voice and glossary that the site's UI text follows.

### Modified Capabilities

- `chord-editor`: the chord input's buttons are Done, Remove and Cancel; the badge's word comes from the app.

## Impact

- `apps/web/app`: `editor/help.tsx`, `editor/sheet-editor.tsx` (chord input), `routes/editor.tsx` (prototype note), `routes/home.tsx`, and the badge's word in the editor's CSS.
- `packages/chord-editor`: `style.css` reads the badge's word from a custom property.
- `apps/web/e2e`: tests that use the chord input's button names.
- `docs/`: the new `ui-text.md`; `design-direction.md` (text belongs to `ui-text.md`, the canvas to layout and looks, no more copies); `roadmap.md` (M2g done); `design/` deleted; `.prettierignore` loses its entry.

## Open Questions

- Should a test catch words the glossary rules out, such as "caret" or "OK", in the app's text?
- Does the home page's meta description, "A library for your sheet music.", stay?
- Do the docked toolbar's name ("Section 2 of 3") and the help's title ("How to edit") need another look?
