# Proposal

## Why

Each part of the app that moves has its own keyframes, durations and reduced-motion rule: seven `@media` blocks and one check in script. They match today only by chance, and new parts have no rule to follow. The transitions in #136 and the loading states in #137 need one concept first. This is step 7 of the UX overhaul (#89).

## What Changes

- A written concept for motion in `docs/motion.md`, next to `docs/ui-text.md`:
  - **Where things sit.** Sheets, Collections and a collection are peers and fade into each other; nothing slides between them. A sheet rises over the shell, Back reverses it, and the row's title turns into the sheet's heading. Play to Edit is a mode: only the bar changes. The shell never moves.
  - **Calm.** Material 3's standard curves, no springs or overshoot. Exits are faster than entries.
  - **Overlays.** Menus and dialogs fade and grow a little from their button or the centre; panels and bottom sheets slide from their edge; the ways of "New sheet" rise above the button one after another.
  - **What stays still.** The editor's scroll to the cursor, the save state, and the active section, whose look changes at once.
  - **Reduced motion.** Nothing moves. The loading bar and the photo import's sign stand still.
- Shared tokens in `tokens.css`: three durations (150, 200 and 300ms) and three curves (enter, exit, move), Material 3's standard decelerate, accelerate and standard curves. With reduced motion the durations are 0ms, in one place.
- What moves today keeps its durations but takes the new curves, so it settles a little more softly.
- What moves today uses the tokens: the edge panel, the key panel, the docked chord input and toolbar, the chord's lift, the Lyrics only switch, and the dimming of old search results. The per-file reduced-motion rules and the script check go.
- The Lyrics only switch moves its handle without changing its layout.
- `docs/design-direction.md` points to the concept.
- Not in this change: page changes, menus, dialogs and the "New sheet" menu move in #136. Loading states are #137.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `design-system`: a requirement that nothing on any page moves with reduced motion.

## Impact

- `apps/web/app/ui/tokens.css`, `shell/edge-panel.css`, `shell/view-button.css`, `editor/key-button.css`, `editor/chord-input.css`, `editor/sheet-editor.css`, `editor/sheet-editor.tsx`, `ui/loading-bar.css`, `photos/photo-import-dialog.css`, `sheets/sheet-list.css`, `routes/sheets.css`, `collections/add-sheets-dialog.css`.
- `packages/chord-editor/src/style.css`: its durations become custom properties the app sets.
- New `docs/motion.md`; `docs/design-direction.md`.
- `e2e/editor.spec.ts`, `e2e/sheet-editor.spec.ts`, `e2e/play.spec.ts`, `e2e/library.spec.ts`.
- No new dependency.

## Open Questions

- Should the `/design` page show the tokens, for example a panel that opens at each duration?
