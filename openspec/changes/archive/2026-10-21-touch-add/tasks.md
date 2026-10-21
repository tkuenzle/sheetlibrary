# Tasks

## 1. The button

- [x] 1.1 The chord layer shows a "+ Chord" button above the caret when a touch press placed a caret in the active section, at least 44px tall, with the gap set by a new custom property. Style it in `style.css` and document the property in its header. Verify with Playwright tests on the phone project: a tap on a letter shows the button above the caret, also in a section the tap makes active; a click on the desktop project and a touch selection don't show it.
- [x] 1.2 Typing, opening the chord input, and the caret leaving the section hide the button; the next tap that moves the caret shows it again. Verify with a Playwright test on the phone project for typing, then tapping again.
- [x] 1.3 A press on the button keeps the editor's focus, and a tap calls `onAddChord` with the caret's position. Verify with Playwright tests on the phone project for the spec's scenarios: adding on a letter with one undo step and the caret unchanged, and adding to a pile.
- [x] 1.4 The button shows only once the caret has been still for about 150ms with no finger down, and hides when it moves. Verify with Playwright tests on the phone project: after a tap, the button never shows at the old caret; while a finger is down and the caret moves, no button shows, and after the finger lifts it shows once, at the last caret.

## 2. Room for the button

- [x] 2.1 The layer places the button again on `visualViewport` resize and scroll, and puts it below the caret when its top would be above the visible area. Verify with a Playwright test on the phone project: with the tapped line at the top of the window, the button shows below the caret and adds a chord.
- [x] 2.2 `/sheet-editor?add-offset=<length>` sets the gap's custom property on the editor. Verify with a Playwright test that the button's position changes with the parameter.

## 3. Trying it on phones

- [x] 3.1 On the preview link, try the button on an Android phone: the gap to the line's chords, the keyboard opening after the tap, adding on a letter and to a pile, the Paste menu after a tap on the caret and on the caret handle, dragging the caret, and whether the short delay feels slow. Set the gap's default in `style.css`. Verify by writing the outcome and the chosen gap into design.md.

No iPhone was at hand. The iPhone pass, of the button and the existing editor, is a step before M2f in `docs/roadmap.md`.

## 4. Roadmap

- [x] 4.1 In `docs/roadmap.md`, mark touch-add as done with its approach, move "Add after" out of touch-add as an idea for keyboard users, and add the iPhone pass before M2f. Verify the text matches the merged behavior.
