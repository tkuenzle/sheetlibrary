# Tasks

## 1. Keeping the caret

- [x] 1.1 `insertChord` maps the selection as `moveChord` does, so a trailing space added at the end of a line doesn't push the caret. Verify with a unit test in `chords.test.ts`: with the caret at the end of a line, adding a chord there leaves the caret before the new space.
- [x] 1.2 Found while building: undoing an added chord didn't remove it, because the rescue put it back, and redoing a deleted chord didn't delete it. The rescue skips undo and redo, which bring back a state that was already rescued. Verify with unit tests in `rescue.test.ts` for both.

## 2. The "+" and the preview

- [x] 2.1 On mouse moves over the editor, the chord layer finds the letter under the pointer with `letterAt` and checks that the point is below the text of its row, in a line of the active section. There it shows the drop caret in front of the letter, in the lyrics, and a "+" right under it. It hides them elsewhere, when the mouse leaves, and during a drag. Style the "+" in `style.css` and document any new custom property in its header. Verify with a Playwright test on the desktop project: below the "r" of "wretch" the caret shows in front of the "r" and the "+" under it; over the lyrics and below another section's lyrics no "+" shows.
- [x] 2.2 A mouse press in the band is stopped before the editor sees it, and the click calls a new `onAddChord(pos)` option. Touch and pen presses go to the editor as before. Verify with a Playwright test on the desktop project that the text caret and the active section don't change, and on the phone project that a tap below a letter still places the caret.

## 3. Adding in the app

- [x] 3.1 `SheetEditor` passes `onAddChord` and opens the chord input for a new chord at that letter. Verify with Playwright tests on the desktop project for the spec's scenarios: adding on a letter with one undo step, adding to a pile, adding at the end of a line, and a click on the lyrics placing the caret.
- [x] 3.2 Check on the preview link in a desktop browser that the "+" reads clearly next to the labels of the line below, and decide between the drop caret and a ghost label for the preview. Verify by writing the outcome into design.md. Outcome: the caret moved into the lyrics, and the active section got more line height.

## 4. Roadmap

- [x] 4.1 In `docs/roadmap.md`, mark chord-add as done with its approach, and add touch-add to M2d as the proposal describes. Verify the text matches the merged behavior.
