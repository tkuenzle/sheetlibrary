# Tasks

## 1. Spike

- [x] 1.1 Spike joining an appended clean-up transaction to the previous undo step in prosemirror-history; verify with a throwaway Vitest test that one undo brings back a removed section with its text, and record in design.md whether the goal or the fallback is used (if the fallback, update the "Removed section" scenario)

## 2. Sheet document

- [x] 2.1 Add the `section` node (`doc: section+`, `section: line+`, rendered as `<section class="section">`) and make the rescue plugin visit lines at any depth; verify the ported rescue tests pass, with the test notation separating sections by a blank line
- [x] 2.2 Replace the section adapter with `docFromSheet` and `handBackSheet`: clean up every section, drop empty ones, check the whole sheet, and load a sheet with no sections as one empty section; verify with Vitest tests for the scenarios of "Editing a sheet" and "Handing back a sheet"

## 3. Active section and clean-up

- [x] 3.1 Add the active-section plugin: follow the selection's section, an "end editing" command, and a node decoration; verify with Vitest tests that moving the caret changes the active section and that ending editing clears it
- [x] 3.2 Keep a selection inside its anchor's section and make Mod-a select the active section; verify with a Vitest test for "Selection across sections"
- [x] 3.3 Clean up a section when the active section changes, never removing the last section, and join it to the previous undo step (or not, as 1.1 decided); verify with Vitest tests for "Finishing a section" and "Undo across sections", including redo after undoing a removed section
- [x] 3.4 Add the dimmed look to the package stylesheet as a CSS custom property; verify the package exports it

## 4. Splitting and joining

- [x] 4.1 Add the Enter command that splits a section on an empty line; verify with a Vitest test for "Enter on an empty line", including an empty last line
- [x] 4.2 Add the Backspace command that joins a section with the one before; verify with a Vitest test for "Backspace at the start" and that undo splits them again
- [x] 4.3 Add a `clipboardTextParser` that splits pasted text into sections on blank lines; verify with a Vitest test for "Paste with blank lines" and pasting into the middle of a section

## 5. Test page

- [x] 5.1 Turn the React wrapper into a sheet editor: Escape and a click outside the sheet end editing, the chord input doesn't; verify by hand with `just dev`
- [x] 5.2 Move the test page to `/sheet-editor` (noindex) with the whole seed song, **Done**, the JSON view and **Edit**, and remove `/section-editor`; verify by hand with `just dev`
- [x] 5.3 Move the Playwright tests to `/sheet-editor` and add tests for arrowing into the next section, selection across sections, Escape removing an emptied section, the chord input keeping the section active, Enter twice, paste and undo of a removed section; verify `just e2e` passes on desktop and phone

## 6. Docs and checks

- [x] 6.1 Update `docs/roadmap.md`: M2c without reordering, a new M2e section operations (dragging sections to reorder them), publish as M2f and UI polish as M2g, and the open question on undo and pasting answered; verify the roadmap matches proposal.md
- [x] 6.2 Run `just spec-check` and `just check`; verify both pass
