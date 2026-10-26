# Tasks

## 1. The toolbar moves to React

- [x] 1.1 Compare `docs/design/` with the canvas's `project/*.dc.html` files and copy any that changed. Verify every file matches the canvas.
- [x] 1.2 Change the toolbar plugin to take the app's element and call `onSectionToolbar({ index, count, docked } | null)`. It writes only `top`, `bottom` and its `data-*` attributes, keeps focus on pointerdown, and watches the element's size. Verify the package's unit tests and `just typecheck` pass.
- [x] 1.3 Add a `SectionToolbar` component in `apps/web` with `Toolbar`, `IconButton` and `Button`, and render it in `SheetEditor`. "Add chord" asks the package to open the chord input at the caret, and the move buttons ask it to move the section. Verify a unit test renders the buttons from a given state, and that "move up" is disabled in the first section.
- [x] 1.4 Update the e2e helpers to the names "Add chord", "Move section up" and "Move section down". Verify the toolbar tests in `sheet-editor.spec.ts` pass in both projects.

## 2. Beside the section, or docked

- [x] 2.1 Add the `compact` media query option, `(pointer: coarse)` by default, and set `data-compact` on the editor's mount. Move `has-docked-toolbar` and `is-adding` to data attributes. Verify the docked toolbar tests still pass on the phone project.
- [x] 2.2 In the app, pass `(pointer: coarse), (max-width: …)` with the width where the left margin no longer fits, and reserve the margin when not compact. Verify an e2e test: with a mouse in a narrow window the toolbar is docked.
- [x] 2.3 Style the toolbar beside the section as a vertical pill with the large "Add chord" button and tooltips to the right. Verify e2e tests: the toolbar is left of the active section, and resting on its first button shows "Add chord".
- [x] 2.4 Keep the toolbar in the window while a tall active section scrolls, never past the section's bottom. Verify an e2e test in a short window: scrolled to the section's last line, the toolbar is in view and next to the section; "Pressing move again" still passes.
- [x] 2.5 Style the docked toolbar as in the mockups: a pill with "Move" and the move buttons, and a "Chord" button named "Add chord". Verify an e2e test on the phone project finds "Move" in the docked toolbar.
- [x] 2.6 Use the `move_up` and `move_down` icons for the move buttons, beside the section and docked, and on the `/design` page. Verify a unit test renders the move buttons with them.

## 3. Looks move to the app

- [x] 3.1 Remove the looks from the package's `style.css`, along with `--chord-editor-chord-color`, `--chord-editor-dash-color`, `--chord-editor-dimmed-opacity` and `--chord-editor-toolbar-room`. Document the layout properties and the state hooks in its header. Verify with `rg` that the removed properties are used nowhere.
- [x] 3.2 Style the editor in the app with role tokens: the active section as a sheet, dimmed sections in `--text-dimmed` and `--chord-dimmed`, the selected and dragged labels as pills, the "+" as a round dot, and the drop caret. Give the active sheet and the selected pill a transparent outline for forced colors. Verify the e2e tests that check labels over their letters pass in both projects, and an e2e test with `forcedColors: "active"` finds an outline on the selected label only.
- [x] 3.3 In `docs/design-direction.md`, describe the split: layout properties and state hooks from the package, looks from the app. Verify it matches `design.md`.

## 4. Section numbers

- [ ] 4.1 Add the section counter to the package's CSS, with "Section 2" as its alternative text, and place and style the badges in the app: left of the lyrics, on a tablet too, and above them only in a narrow window. Verify e2e tests: a tablet shows the badge left of the lyrics and a phone above them, after moving the second of three sections up it shows "1", the second section's accessible text starts with "Section 2", and the left arrow at a section's start goes to the section before, in WebKit too.

## 5. Chord input

- [x] 5.1 Pass an anchor, the letter's box in window coordinates, with every callback that opens the chord input, and place the input from it in `SheetEditor` without `coordsAtPos`. Verify `rg coordsAtPos apps/web` finds nothing and the chord input e2e tests pass unchanged.
- [x] 5.2 Restyle the chord input with `Popover` and `Button`: an input with an accent border, filled OK, and text Delete and Cancel, all at least 44px tall. Verify the chord input e2e tests pass unchanged.

## 6. Reduced motion

- [x] 6.1 Turn off the lift and fade transitions under `prefers-reduced-motion: reduce`. Verify an e2e test with reduced motion: the label is lifted right after a touch drag starts, with no transition.

## 7. Integration

- [x] 7.1 Run `just check`. Verify it passes.
- [ ] 7.2 Compare `/editor` with the editor boards in light and lamplight, on desktop, tablet and phone, with the `browser-check` skill, and try it in the iOS Simulator. Verify it matches the boards, except the parts that wait for the page shell, and note any deliberate difference.
- [x] 7.3 In `docs/roadmap.md`, mark the editor facelift done with what it decided. Verify it matches `design.md`.
- [x] 7.4 After pushing, open `/editor` on the pull request's preview link. Verify the new toolbar and sections show.

## Workflow follow-up

- Archive the change after review, in the same pull request.
