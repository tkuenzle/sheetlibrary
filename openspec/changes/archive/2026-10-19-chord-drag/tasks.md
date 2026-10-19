# Tasks

## 1. Move command

- [x] 1.1 Add `moveChord(id, pos, index?)` to the package: it takes the chord off its letter and puts it at `index` on the letter at `pos`, or last without an index; verify with Vitest tests for moving to another letter, into the middle of a pile, reordering a pile on the same letter, and one undo putting it back

## 2. Dragging in the chord layer

- [x] 2.1 Port the spike's pointer handling to the package's chord layer: 6px threshold, a release without a drag fires `onChordClick`, the `click` listener goes away, and a drop dispatches `moveChord` without moving the text caret; verify the existing Playwright tests for clicking chords still pass
- [x] 2.2 Find the drop target with `letterAt`, ignore targets outside the active section, and show the drop caret in the text; verify by hand with `just dev` that the caret hides over another section
- [x] 2.3 Add the pile hit test against the label boxes, with the caret drawn between labels in the chord row; verify by hand with `just dev` on a pile of three chords
- [x] 2.4 Cancel a drag on Escape, caught in the capture phase so editing doesn't end; verify by hand with `just dev` that the section stays active
- [x] 2.5 Scroll the window in a frame loop while the pointer is near its top or bottom edge, keeping the label under the pointer and updating the target; verify by hand with `just dev` in a short window
- [x] 2.6 Add the drag styles to the package stylesheet: `touch-action: none` and a grab cursor on labels, the dragged label, and the drop caret; verify the drag looks like the spike's
- [x] 2.7 Close the chord input without saving when a drag starts, through a new `onDragStart` option; verify with a Playwright test for the "Chord input open" scenario

## 3. Playwright tests

- [x] 3.1 Copy the spike's `dragLabel` helper into `sheet-editor.spec.ts` and add tests for the scenarios of "Moving chords by dragging", "Dragging stays in the active section", "Dropping into a pile" and "Scrolling while dragging"; verify `just e2e` passes on desktop and phone

## 4. Docs and checks

- [x] 4.1 Update `docs/roadmap.md`: split M2d into chord-drag, chord-layout (pile and chord-on-space push, trailing space, late labels) and chord-add (hover icon, tap above a word, drag to add); verify the roadmap matches proposal.md
- [x] 4.2 Run `just spec-check` and `just check`; verify both pass
