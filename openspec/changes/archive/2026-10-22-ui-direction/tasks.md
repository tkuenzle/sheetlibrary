# Tasks

## 1. Starting point

- [x] 1.1 Take screenshots of `/` and `/editor` as they are today with the `browser-check` skill, on desktop and phone: idle, active section with toolbar, docked toolbar, chord input, a dragged chord. Verify each editor state listed in 4.1 that exists today is covered.

## 2. Direction boards

- [x] 2.1 Create the Design artifact on claude.ai. Verify it opens and is private.
- [x] 2.2 Draw 2–3 polished concepts of one screen, the active section with chords and its toolbar, on desktop and phone. They differ in the arrangement of the page, the toolbar and the buttons, with fonts from Google Fonts. Additions such as a title, section headers or the key are marked as rough proposals. Verify each board in a local Playwright screenshot before publishing it, and that the fonts load.
- [x] 2.3 Stop and ask the user to pick a direction, or a mix, and an icon set for the toolbar. Verify the choice is written down before going on.

## 3. Foundation

- [x] 3.1 Draw the foundation board: type scale, spacing, buttons, the popover, and the palette as role tokens with light and lamplight values. Verify text and chord colors meet WCAG AA contrast in both versions.

## 4. Detailed mockups

- [x] 4.1 Draw the editor in the picked direction on desktop, tablet (portrait) and phone: idle, active and dimmed sections, chord labels (idle, selected, dragged, lifted by touch), the "+" and drop caret, the chord input (restyled only), the toolbar above the section and docked above the keyboard, the page header with the placeholder wordmark, and the prototype note. Verify against the screenshots from 1.1 that every state has a mockup.
- [x] 4.2 Draw the home page on desktop and phone. Verify it links to the editor as today.
- [x] 4.3 Sketch the library list and the play view, roughly, on desktop and tablet. Verify they use only the foundation's type and colors.
- [x] 4.4 Draw one editor screen in lamplight. Verify it needs no tokens beyond the role list.

## 5. Docs

- [x] 5.1 Write `docs/design-direction.md`: the picked direction and why, the role token list, the fonts, the icon set, and the canvas link. Verify it matches the canvas.
- [x] 5.2 In `docs/roadmap.md`, split M2g into steps (direction, tokens and base components, editor facelift, page shell and home, UI text), drop "values, not structure", note the temporary `docs/design/` copies, and add a real logo to the "later" list. Verify the text matches `design.md`.
