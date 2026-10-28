# Tasks

## 1. Model

- [x] 1.1 Add the optional `label` to `Section` in `packages/chordsheet/src/sheet.ts`, keeping version 1, and verify with `just typecheck`
- [x] 1.2 Make `checkSheet` report a section label that isn't text, has a line break, is empty or only spaces, or is longer than 40 characters, and verify with tests in `check.test.ts`
- [x] 1.3 Make `cleanUpSection` trim the label, make its runs of spaces one space and remove it when empty, and verify with tests in `clean-up.test.ts`

## 2. Labels in the editor's document

- [x] 2.1 Give the `section` node a `label` attribute (default `null`) and copy it both ways in the adapter, leaving it out of the stored section when `null`; verify with an `adapter.test.ts` round trip of a sheet with a labeled and an unlabeled section
- [x] 2.2 Make Enter on an empty line give the new section no label, and verify with `sections.test.ts` tests: splitting "Verse 1" leaves the new section unlabeled, joining "Verse 1" with "Chorus" keeps "Verse 1" and one undo brings both back, and joining an unlabeled section with "Chorus" leaves no label
- [x] 2.3 Add a command that sets or clears the label of a section in one undo step, normalized to NFC and cleaned up by the model, and verify with unit tests for setting, clearing, extra spaces and undo

## 3. The label row in the package

- [x] 3.1 Draw each section with a node view: a row outside the editable content that holds the label, "Add label" in the active section without one, or nothing, always the same height. Remove the badge counter, its `::before` and `--chord-editor-section-name`, and document the section label hooks at the top of `style.css`. Verify in the harness that the left arrow at a section's start goes to the section before
- [x] 3.2 Take the "Add label" word from the custom property `--chord-editor-add-label` and show no text without it; verify with a harness e2e test
- [x] 3.3 Add the `onLabelClick` option with the section and the label's box, called only for the active section; a click on another section's label only makes it active. Verify with a harness e2e test
- [ ] 3.4 Check that Ctrl+Shift+L reaches the page in Chrome, Safari and Firefox (⌘⇧L on a Mac), then make it call `onLabelClick` for the active section; verify with a harness e2e test
- [x] 3.5 Make screen readers read the section label before the lyrics, and nothing for a section without one; verify with an accessibility-tree assertion in a harness e2e test

## 4. The label field and look in the app

- [x] 4.1 Build the section label field in `apps/web/app/editor/`: a combobox with the label's size and font that grows with its text (`field-sizing: content`, or `size` from the text's length), with the suggestions Intro, Verse, Pre-chorus, Chorus, Bridge, Solo and Outro below, narrowed by text they contain, ignoring case. Enter, a click elsewhere or a picked suggestion keeps; Escape cancels; empty removes; at most 40 characters. Verify with a component test like `section-toolbar.test.tsx`
- [x] 4.2 Open the field from `onLabelClick` in `sheet-editor.tsx`, keep editing and the active section while it is open, give the focus back to the editor when it closes, and pass "Add label" to the editor; verify with `just e2e`
- [x] 4.3 Label the seed song's sections "Verse 1" and "Verse 2" and list "Ctrl Shift L" and "⌘ ⇧ L" in the help; verify with `seed-song.test.ts` and the help's e2e test
- [x] 4.4 Style the label row after the "Section labels" page of the design canvas (dimmed text, soft pill when active, outlined field), and remove the badge styles, the 72px left padding and the phone badge rule; verify with the browser-check skill on a wide window, a tablet and a phone
- [x] 4.5 Add e2e tests in `apps/web/e2e/sheet-editor.spec.ts` for the spec's scenarios (label above the lyrics, lyrics stay put, "Add label", rename and undo, Escape, remove, extra spaces, another section's label, the shortcut and the cursor, narrowing, tapping a suggestion, split and join) and drop the badge tests; verify with `just e2e`
- [x] 4.6 Update `docs/design-direction.md` (labels above the lyrics, no badges, the badge colors) and `docs/ui-text.md` ("Add label", the field's name "Label", the suggestions, the label shortcut, no "Section badge", the glossary's note on "verse" and "chorus"), and verify with `just fmt-check`

## Workflow follow-up

- Correct issue #44, which says the model gets a new version.
- Open an issue for the home page's sample sheet, which still shows a badge.
- Archive the change after review.
