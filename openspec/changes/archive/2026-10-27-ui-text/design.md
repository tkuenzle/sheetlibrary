# Design

## Context

The UI text sits in five files of `apps/web/app`: `editor/help.tsx`, `editor/section-toolbar.tsx`, `editor/sheet-editor.tsx` (the chord input), `routes/editor.tsx` and `routes/home.tsx`, plus the shell's "Sheet Library", "How to edit" and "Close". The one word in `chord-editor` is the badge's: `style.css` sets `content: counter(section) / "Section " counter(section)`. The app already styles the badge in `editor/sheet-editor.css`. The e2e tests find the chord input's buttons by name and read the badge's word in the sections' text.

## Goals / Non-Goals

**Non-Goals:**

- Moving the strings into one module or adding i18n. There is one language and about 40 strings.
- Changing the words in code, specs and docs. "Caret" stays the precise word there; the glossary is for what users see and hear.
- Updating the text on the design canvas.

## Decisions

**The glossary is a short doc, not a test.** `docs/ui-text.md` has the voice, a table of the words to use with the words they replace, and the toolbar and key names as they are. Reviews check new text against it. Rejected for now: a test for ruled-out words. Words like "change" or "OK" are fine in other places, so the test would need exceptions; it is an open question in the proposal.

**The badge's word comes in through a custom property.** The package sets `content: counter(section) / var(--chord-editor-section-name, "") counter(section)`, and the app sets `--chord-editor-section-name: "Section "` on the editor. Without the app, a screen reader reads only the number. This follows the package's other `--chord-editor-*` properties. Rejected: the app overriding the whole `content` declaration. It works too, but the app would then repeat the package's counter name.

**The badge shows in Firefox too.** Firefox 157 doesn't accept `counter()` in the alternative text and drops the whole rule, so the badge has been missing there since editor-facelift. The package first sets `content: counter(section)`, and sets the rule with the alternative text only inside `@supports (content: "a" / counter(a))`. Firefox then shows the number, and screen readers read only the number there. Rejected: a second `content` declaration after the first, as browsers usually fall back. A declaration with `var()` can't be dropped when the stylesheet is read; Firefox would only fail it later, after it had already replaced the first one.

**The new text.** Everything not listed keeps its text.

| Where | Today | New |
|---|---|---|
| Help intro | Tap a section to edit it. / Click a section to edit it. | Tap a section to edit it / Click a section to edit it |
| Help, touch | Tap **Chord** in the toolbar to add a chord at the caret | Tap **Chord** in the toolbar to add a chord at the cursor |
| Help, touch and mouse | Tap / Click a chord to change it, drag it to move it | Tap / Click a chord to edit it, drag it to move it |
| Help, keys | Add a chord at the caret, or change it | Add a chord at the cursor, or edit it |
| Chord input | OK, Delete, Cancel | Done, Remove, Cancel |
| Home text | Coming soon. Until then, you can try the chord editor: place chords above the lyrics and move them by hand. | Coming soon. Until then, try the chord editor: place chords above the lyrics and move them by hand. |

The prototype note already follows the voice: it says what happens, in two short sentences.

## Risks / Trade-offs

- [The alternative text isn't read the same in every engine] → The e2e tests run in Chromium only. A one-off check reads the badge's computed `content` with Playwright's Firefox and WebKit, and looks at the badge. Playwright's WebKit doesn't start on the development Mac, so WebKit is untested, as Safari is so far.
- [The canvas keeps the old text and misleads later] → `design-direction.md` says the canvas is the source for layout and looks only, and `ui-text.md` for words.
