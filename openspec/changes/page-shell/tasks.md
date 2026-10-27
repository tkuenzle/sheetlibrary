# Tasks

## 1. Mockups and widths

- [x] 1.1 Compare `docs/design/` with the canvas's `project/*.dc.html` files and copy any that changed or are new (`Editor-desktop-narrow`, `Editor-tablet-help`, `Editor-phone-help`). Verify every file matches the canvas.
- [x] 1.2 Add `breakpoints.ts` with the phone (up to 640px), middle and wide (from 1024px) media queries, build `compact` in `sheet-editor.tsx` from it, and move the 600px rules in `tokens.css`, `sheet-editor.css` and `section-toolbar.css` to 640px with a comment pointing to the file. Verify a unit test that fails on any `@media` width under `app/` not in the file, and the badge e2e tests on the phone project.

## 2. Top bar

- [x] 2.1 Add `TopBar` in `app/shell/` with "Sheet Library" linking home, an optional song title after a "/", and an optional action. Verify a unit test renders the link and the title.
- [x] 2.2 Use it on the home page and the editor page, and not on `/design` or the harness. Verify an e2e test: clicking "Sheet Library" on `/editor` opens `/`.

## 3. Side panel

- [x] 3.1 Add the `--scrim` token in light and lamplight to `tokens.css` and the `close` icon to `icons.ts`. Verify the icon test lists `close` and the token is in the table in `docs/design-direction.md`.
- [x] 3.2 Add `SidePanel` in `app/shell/`: an `<aside>` from 1024px, and below it a "How to edit" button for the top bar that opens the content in a modal `<dialog>` sheet from the right, closed by Escape, its close button, a click on the backdrop, or the window growing past 1023px. It slides in, except with reduced motion. Verify e2e tests: at 1280px the panel is beside the editor with no help button; at 900px the button opens the sheet, Escape closes it, and focus is back on the button.
- [x] 3.3 Give the sheet and the aside an outline in forced colors, as the base components have. Verify an e2e test with `forcedColors: "active"` finds an outline on the open sheet.
- [x] 3.4 Keep the aside in view while the page scrolls, at most as tall as the window. Verify an e2e test at 1280px in a short window: scrolled to the end, the panel is in view.

## 4. Editor page

- [x] 4.1 Show "Amazing Grace" as the heading and in the top bar, except on a phone, and remove the old hint paragraph. Verify the editor e2e test reads the heading, and the title in the top bar outside the phone project.
- [x] 4.2 Put the prototype notice in the panel and above the song, each shown by CSS at its widths, with the short text on a phone. Verify e2e tests: at 1280px the visible notice is in the panel, on the phone project it is above the song without opening the help.
- [x] 4.3 Fill the panel with the boards' help: "With touch", the keys with "Ctrl K" or "⌘ K", and "With a mouse", hiding the group that doesn't match the main pointer in CSS. Verify e2e tests: the phone project shows "With touch" and no "With a mouse", chromium the opposite.
- [x] 4.4 Keep editing when the help is used: `SheetEditor` ignores clicks inside `data-keeps-editing`, which the help button and its sheet carry. Verify an e2e test with a mouse at 900px and on the phone project: with a section active, opening and closing the help leaves it active.
- [x] 4.5 Lay out the editor and the panel as on the boards: the panel at most 360px, and the toolbar margin beside the section at 1024px. Verify an e2e test at 1024px: the toolbar is left of the active section and the panel right of the song.

- [x] 4.6 Set the browser title to "Amazing Grace | Sheet Library". Verify the editor and home e2e tests check it.
- [x] 4.7 Add `onEditedChange` to `SheetEditor`, and on the editor page ask the browser to confirm leaving while the song differs from the seed. Verify e2e tests: after typing, clicking "Sheet Library" brings up the prompt and dismissing it stays with the changes; without edits, and after undoing them, the home page opens without one; the reload test accepts the prompt.

## 5. Home page

- [x] 5.1 Build the home page from the boards: the headline, the "coming soon" text, the "Try the chord editor" button and the tilted sample, `aria-hidden`, with only lines that have one chord per spot and no chord on a space. Verify the unit test and `home.spec.ts` check the heading, the text and the link, and that the sample is hidden from the accessibility tree.

## 6. Integration

- [x] 6.1 Run `just check`. Verify it passes.
- [x] 6.2 Compare `/` and `/editor` with the boards in light and lamplight at 1280px, 900px, 834px (tablet), 620px and phone size, with the `browser-check` skill. Pick the lamplight `--scrim` there. Verify they match the boards, and note any deliberate difference.
- [x] 6.3 In `docs/design-direction.md`, describe the panel's two forms, the three widths and `--scrim`. In `docs/roadmap.md`, mark the page shell done with what it decided, and add a "Later" line for the read-only sheet view, linking issue #23. Verify both match `design.md`.
- [x] 6.4 After pushing, open `/` and `/editor` on the pull request's preview link. Verify the top bar, the panel and the new home page show.

## Workflow follow-up

- Archive the change after review, in the same pull request.
