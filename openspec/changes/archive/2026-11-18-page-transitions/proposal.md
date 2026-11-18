# Proposal

## Why

Pages change with a hard cut. `docs/motion.md` says how page changes move: the shell's screens fade, a sheet rises over the shell and drops on Back, the row's title turns into the sheet's heading, and Play to Edit only changes the bar. This builds it. It is step 8 of the UX overhaul (#136). Menus, dialogs and bottom sheets move in #160.

## What Changes

- Page changes use React Router's `viewTransition`, which uses the browser's View Transitions. Only the links and moves listed here ask for one; other changes, such as typing a search or picking a capo, still change at once.
- Between Sheets, Collections and a collection, the content fades. The rail and the bar at the bottom stay still.
- Opening a sheet from a row, it rises over the shell, and the row's title turns into the sheet's heading. Back, by the arrow or the browser, drops the sheet and the heading turns back into the row's title.
- Play to Edit and back: a short fade, without sliding. "Done" moves like the browser's back. The two pages are laid out differently, so the sheet doesn't stay exactly in place yet; lining them up is #161.
- How a move looks follows from where it goes, not from the browser's history: to a sheet it rises, from a sheet to a screen of the shell it drops, between the shell's screens it fades.
- When the browser plays its own move, as on an iPhone when swiping back, the app's move doesn't play on top.
- When the new page's data comes later than the loading bar waits (200ms), the page changes at once: the person has already waited, and a move would add to it. Skeletons in #137 will let moves start right after the tap.
- A link to the page that is open, such as "Sheet Library" on Sheets, doesn't move.
- With reduced motion, nothing moves. The tokens already make that 0s.
- `docs/motion.md` says that page changes use View Transitions, and how.
- No new dependency. Browsers without View Transitions keep the hard cut.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `site-layout`: how page changes move, between the shell's screens, to and from a sheet, and between Play and Edit.
- `design-system`: reduced motion covers page changes.

## Impact

- `apps/web/app/root.tsx`: marks which kind of move is playing, and skips the app's move when the browser played its own.
- Links and moves: `ui/nav-rail.tsx`, `ui/nav-bar.tsx`, `sheets/sheet-list.tsx`, `sheets/recent-sheets.tsx`, `shell/sheet-bar.tsx`, `sheets/sheet-moves.ts`, `routes/sheet.edit.tsx`, `routes/collections.tsx`.
- The sheet's heading in `routes/sheet.tsx` and `routes/sheet.edit.tsx`.
- New CSS for the moves, using the motion tokens.
- `docs/motion.md`.
- e2e tests for the moves, with and without reduced motion.

## Open Questions

- The account page sits in the shell. Should it fade like the other screens?
- "New sheet" and the imports open a new sheet in Edit. Should they rise too?
- Links from the home page and sign-in into the app: move, or cut?
- A link from the play view to one of the sheet's collections leaves the sheet. Should it drop like Back?
- If the row's title is off screen, for example after a search changed, should the sheet just rise without the title moving?
