# Tasks

## 1. Lifting the label

- [x] 1.1 The chord layer adds `is-lifted` to a label dragged by touch, and `style.css` lifts it with `translate` by `--chord-editor-touch-lift`, sliding up with a short transition. Document the property in the stylesheet's header. Verify with a Playwright test on the phone project: during a touch drag, the label sits the lift above where it was, and the drop caret is above the touch point.
- [x] 1.2 During a touch drag, the frame loop updates the drop target on every frame. Verify with a Playwright test on the phone project: after the finger holds still while the label slides, the drop caret is under the lifted label.
- [x] 1.3 `startDrag` in `sheet-editor.spec.ts` measures the label's offset to the finger again once the slide has ended. Verify that the existing drag tests pass on both projects.
- [x] 1.4 Verify with a Playwright test that a touch drag drops the chord on the letter under the label, not under the finger, and that a mouse drag leaves the label under the pointer.

## 2. Scrolling

- [x] 2.1 On a touch drag, the frame loop starts scrolling up when the label's top is near the window's top. Verify with a Playwright test on the phone project: the page scrolls up while the finger is outside the top zone. The existing scroll test still passes.

## 3. Trying the lift

- [x] 3.1 `/sheet-editor?lift=<length>` sets `--chord-editor-touch-lift` on the editor. Verify with a Playwright test that the lift changes with the parameter.
- [x] 3.2 Try lifts on an Android phone with the preview link, then set the default in `style.css` and in design.md. Verify by hand that the label and the drop caret show above the finger, and check whether the last line of a long song can be reached at the end of the page.

## 4. Roadmap

- [x] 4.1 Mark touch-drag as done in `docs/roadmap.md`, with the approach and the chosen lift. Verify the text matches the merged behavior.
