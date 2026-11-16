# Proposal

## Why

In a window from 641 to 1023px wide, the rail shows only icons. Their names show only in a tooltip, and the rail can't be opened. That covers a tablet held upright, and a laptop window at half width or zoomed in. There the collections are one step further away than on a wide screen. Issue #148. It goes before #133, so "New sheet" can go into both forms of the rail.

## What Changes

- The compact rail shows each name under its icon, with the open screen marked by a pill around the icon, as in the bottom bar. It gets wider, from 80px to 88px. The tooltips go.
- A menu button "Open navigation" at the top of the compact rail opens the full rail over the dimmed page, with every collection. The full rail is the one wide screens show, with a "Close" button next to "Sheet Library".
- The opened rail is modal: focus moves into it and goes back to the menu button when it closes, and the page behind it is inert. Picking an entry closes it. So do "Close", Escape, a tap on the dimmed page, and a window that gets wider or narrower than the middle width.
- It slides in from the left, and slides out when it closes. After a pick, it slides out once the new page is there. With reduced motion it doesn't slide.
- The sheet's help panel and the opened rail share one panel that slides in from an edge. The help looks and works as before.
- Wide screens and phones stay as they are. "New sheet" (#133) and "Sets" (M7) are on the design board but not part of this change.

Design: the "Middle screens" page of the design canvas, boards "Sheets, middle" and "The rail, opened".

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `site-layout`: the middle-width rail shows names under its icons and a menu button, and it can be opened as the full rail.

## Impact

- `apps/web/app/ui/nav-rail.tsx` and `nav-rail.css`: the compact form with names under the icons, and room for the menu button and the close button.
- `apps/web/app/routes/shell.tsx`: the menu button and the opened rail.
- `apps/web/app/shell/side-panel.tsx` and `side-panel.css`: the help panel moves onto the shared edge panel.
- `apps/web/app/ui/icons/`: adds the `menu` icon.
- `docs/ui-text.md` (Shell line) and `docs/design-direction.md` (the rail on a middle screen).
- Tests: `shell.test.tsx`, `nav-rail.test.tsx`, e2e `library.spec.ts` ("On a tablet") and `design-page.spec.ts` (the compact rail is 88px wide and its links now have text).

## Open Questions

- The dialog needs a name for screen readers. Should it be "Main", like the navigation inside it, or "Navigation"?
- In the opened rail, should the list of collections scroll on its own, with "Sheet Library" and the account in view, as on wide screens? That's what reusing the rail gives.
- Picking the entry of the page that's already open closes the rail and moves nothing. Is that right, or should it stay open?
