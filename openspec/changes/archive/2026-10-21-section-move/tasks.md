# Tasks

## 1. The move

- [x] 1.1 Add a command that moves the active section up or down by replacing it and its neighbour in one step, keeping the caret's offset in the moved section. It returns false at the ends and outside editing. Verify with unit tests in `sections.test.ts`: moving up and down, the caret's spot, the moved section staying active and not cleaned up, the neighbour unchanged, the ends, and one undo making the moved section active.

## 2. The toolbar with a mouse

- [x] 2.1 A plugin view shows ↑ and ↓ buttons at the right edge above the active section, at least 44px tall, with "Move section up" and "Move section down" as names. They are disabled at the ends and missing with one section. The active section gets room above it for them. Style them in `style.css`. Verify with Playwright tests: the buttons show on the active section only, also after hovering a dimmed one, and are disabled at the ends.
- [x] 2.2 Pressing a button keeps the editor's focus and runs the move. Verify with Playwright tests for the spec's "Move up" and "Undo" scenarios.
- [x] 2.3 After a move, the page scrolls by how far the buttons shifted. Verify with a Playwright test for the "Press again" scenario, pressing twice at the same spot.
- [x] 2.4 Turn the buttons into a toolbar (`role="toolbar"`, named "Section") and add a "+ Chord" button in front of ↑ and ↓. It shows also with a single section, and calls `onAddChord` with the caret's position. Verify with Playwright tests on both projects for the spec's "Add on a letter" and "Add to a pile" scenarios, and with a selection.
- [x] 2.5 The hint on `/sheet-editor` mentions the toolbar. Verify on the page.

## 3. The toolbar on touch devices

- [x] 3.1 With `(pointer: coarse)`, dock the toolbar with `position: fixed; bottom: 0`, add `interactive-widget=resizes-content` to the viewport meta tag for Android, lift the toolbar by the part of the page the keyboard covers for iOS, read from `visualViewport` on its resize and scroll, and give the active section no room above it. Verify with Playwright tests: on the phone project, the toolbar's bottom is the window's bottom, also after scrolling; on the desktop project, it sits above the section.
- [x] 3.2 Keep the caret above the docked toolbar: after a change to the caret or the text, and after a viewport change, scroll by how far the caret's line is hidden. Give the page room for the toolbar after its content, and hide the toolbar while a chord is dragged. Verify with Playwright tests on the phone project: after tapping the last line in the window, the caret's line is above the toolbar; Done can be clicked at the end of the page; a dragged chord still scrolls the page down and lands on the last line.
- [x] 3.3 Docked, a move scrolls the caret into view instead of keeping the toolbar in place. Verify the "Press again" scenario on the phone project, tapping twice at the same spot.
- [x] 3.4 Where the page doesn't shrink for the keyboard (iOS), fade the docked toolbar out while the page or the visual viewport moves, and back in at its place about 150ms after both stop and no finger is down. Draw the docked toolbar above the page's own floating parts, such as the chord input. Verify with a Playwright test on the phone project that the chord input scrolls under the toolbar, and in the iOS simulator that the toolbar no longer jumps while scrolling with the keyboard open.

## 4. Removing the floating "+ Chord"

- [x] 4.1 Remove the floating button from the chord layer, with its tap tracking, settling timer and placement, the `--chord-editor-add-offset` property and the `?add-offset` parameter. Remove its Playwright tests. Verify that `chord-add-button` and `add-offset` no longer appear in the code, and that lint, typecheck and all tests pass.

## 5. The chord input inside the screen

- [x] 5.1 Keep the chord input inside the editor's width by measuring the form after it renders, instead of assuming it is 240px wide. A form sticking out widened the page on Android, which put the docked toolbar behind the password manager's bar. Verify with a Playwright test on the phone project: editing the chord at the right end of a line keeps the form inside the window and the page as wide as the window.

## 6. Trying it on a phone

- [x] 6.1 On the preview link, try the toolbar on an Android phone: with the keyboard open and closed, while scrolling, adding chords, pressing move repeatedly, the caret staying above the toolbar, and whether it feels cramped. Verify by writing the outcome into design.md.

## 7. Roadmap

- [x] 7.1 In `docs/roadmap.md`, describe M2e as the section toolbar, note under touch-add that the toolbar replaced its floating button, move dragging sections to "Later", add a "Later" item for planning keyboard shortcuts as a whole, and make M2f's iPhone check cover the docked toolbar instead of the floating button. Verify the text matches the merged behavior.
