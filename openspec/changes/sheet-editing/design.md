# Design

## Context

`packages/chord-editor` (M2b) edits one section: the schema is `doc: line+`, and the adapter has `docFromSection` and `handBackSection`. The rescue plugin walks the doc's direct children as lines (`rescue.ts`). The chord layer finds lines through the DOM (`.line`), so it doesn't depend on the doc's depth. The React wrapper in `apps/web` hands back on **Done**, and the chord input takes focus away from the editor.

## Goals / Non-Goals

**Goals:**
- One editor document per sheet, so undo, paste and later Yjs work on the whole sheet.

**Non-Goals:**
- Locking inactive sections. They are dimmed, not read-only.
- Moving sections, other than by cut and paste.

## Decisions

**Sections are nodes.** The schema becomes `doc: section+`, `section: line+`. A section renders as `<section class="section">`. Splitting the sheet into one editor per section was rejected: undo across sections, pasting blank lines and joining would each need code that crosses editors, and Yjs wants one document per sheet.

**Active state lives in plugin state.** A plugin keeps the active section (its position, or none). It follows the selection's section while editing, and turns to none on an "end editing" command. Losing focus doesn't count, so the chord input keeps the section active. The look comes from a node decoration (`section active`), and dimming is a CSS custom property in the package stylesheet. The state isn't in the document, so it's not stored, not undone, and with Yjs each user would have their own.

**The selection is kept in one section.** An `appendTransaction` moves a text selection's head back inside the section of its anchor. Mod-a selects the active section's text. Blocking such transactions with `filterTransaction` was rejected: it would stop a mouse drag instead of limiting it.

**Clean-up runs when the active section changes.** When the plugin sees the active section change, it appends a transaction that drops the old section's empty lines, or removes the section if nothing is left. Lines without chords and text are the only ones dropped, so no chord is lost and the rescue plugin has nothing to do. The last remaining section is never removed, since the schema needs one. Instead it keeps one empty line, and hand-back drops it.

**Clean-up joins the previous undo step.** Leaving a section is a change to the selection only, which the history ignores. The clean-up is appended to that change with `appendTransaction`, and prosemirror-history adds an appended transaction to the previous undo step, whatever the time between them. So one undo brings back the text and the section together. A spike confirmed it, including redo. The history only starts a new step after `closeHistory`, which the editor doesn't use.

**Splitting and joining are commands.** Enter on an empty line runs before `baseKeymap`. It deletes the line, moves the lines after it into a new section and puts the caret there. If the empty line is the last line, the new section holds one empty line. Backspace at the start of a section moves its lines to the end of the section before. ProseMirror's own `joinBackward` was rejected, because at that spot it merges lines.

**Pasting splits on blank lines.** A `clipboardTextParser` turns plain text into sections, splitting on lines that are empty or only spaces. ProseMirror's slice fitting then splits the section at the caret. Copied sections carry their structure through the HTML (`parseDOM` on `section`). Pasted chords still get fresh ids.

**The adapter covers the sheet.** `docFromSheet` and `handBackSheet` replace the section functions and reuse their per-line code. Hand-back cleans up every section, drops empty ones, and checks the whole sheet with `checkSheet`. A sheet with no sections loads as one section with one empty line.

**The rescue plugin walks lines at any depth.** It visits every `line` node with `descendants` instead of the doc's children. The rules don't change. The test notation separates sections with a blank line, which matches the new rule.

**The test page moves to `/sheet-editor`.** It edits the whole seed song. **Done** ends editing, hands back the sheet and shows it as JSON. **Edit** loads it again. The `/section-editor` route goes away.

## Risks / Trade-offs

- [Clean-up appended to an undo or redo could break redo, because undo restores a selection in another section.] → Tests cover undo and redo across a removed section.
- [Joining clean-up to the previous undo step relies on how prosemirror-history groups appended transactions.] → Vitest tests cover it, so an update that changes it fails.
- [Moving the selection back while the mouse is dragging may flicker.] → Checked by hand and in the Playwright test for selection across sections.
