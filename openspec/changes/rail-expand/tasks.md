# Tasks

## 1. Shared edge panel

- [x] 1.1 Add `shell/edge-panel.tsx` and `edge-panel.css` with the dialog logic and styles from `SidePanelButton`, taking a side, an open state, an on-closed callback, a closing media query and a name, and a way for the content to slide it out. A unit test covers what it renders, and `pnpm test` passes. The unit tests have no DOM, so opening, Escape, a backdrop click and the media query are tested in the browser, by the help's e2e cases (1.2) and the rail's (3.3).
- [x] 1.2 Move `SidePanelButton` onto `EdgePanel` (side right, closes at `wide`), and drop the moved CSS from `side-panel.css`. Verify with the help tests in `sheet.edit.test.tsx` and `e2e/editor.spec.ts` ("the help"), unchanged, and by hand on a sheet at 800px.

## 2. Compact rail with names

- [x] 2.1 Make the compact `NavRail` show each icon in a 56x32 pill with its name under it, 88px wide, without the tooltips and `aria-label`s. Add a slot at the top of the compact form and one after the site's name in the full form. Update `nav-rail.test.tsx` and `shell.test.tsx`, and verify they pass.
- [x] 2.2 Update the compact rail on `/design` if needed, and `e2e/design-page.spec.ts` (88px, links with text, the forced-colors outline on the pill). Verify the spec passes.

## 3. Opening the rail

- [x] 3.1 Add the `menu` icon (Material Symbols Rounded, weight 500, 24px) to `ui/icons/` and `icons.ts`, and verify the icon tests pass.
- [x] 3.2 In `ShellView`, add the menu button "Open navigation" to the compact rail, and an `EdgePanel` on the left after it, closing at `phone` or `wide`. The panel holds the full rail, 304px wide, with "Close" after "Sheet Library". A click on a link inside slides it out, and the new page's heading takes the focus once it has closed. Cover it in `shell.test.tsx`, and verify it passes.
- [x] 3.3 Update the e2e "On a tablet" case in `library.spec.ts`, and add e2e cases for "Opening a collection from the opened rail" and "Closing with Escape": focus moves into the panel, the page is inert, and focus goes back to the menu button or to the new heading. Verify they pass.
- [x] 3.4 Update the Shell line in `docs/ui-text.md` and the rail on a middle screen in `docs/design-direction.md`. Verify they name "Open navigation", "Close" and the names under the icons.

## 4. Check

- [x] 4.1 Check in a real browser at 800px with the browser-check skill: the compact rail against the "Sheets, middle" board, the opened rail against "The rail, opened", the light and lamplight styles, reduced motion, and 200% text zoom. Verify that `just check` passes.

## Workflow follow-up

- Archive the change in the PR that closes #148, before it merges.
