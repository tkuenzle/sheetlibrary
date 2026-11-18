# Proposal

## Why

Menus and dialogs appear and disappear without moving. Only the opened rail, the help, the key panel on a phone and the docked chord input move, each closing in its own way. `docs/motion.md` says how overlays move, and this builds it (#160). Split from #136, before #137.

## What Changes

- Menus fade and grow a little from their button. The key, capo and View panels under their button on wider screens do the same.
- On wider screens, the chord input grows from the letter it opens under, like a menu, and shrinks back when it closes.
- Dialogs fade and grow a little from the centre, over a fading scrim: the confirm and name dialogs, Add sheets, Choose collections, the import dialog and photo import.
- Photo import, a bottom sheet on a phone, slides up from the bottom there instead.
- The "New sheet" menu on a phone: its ways rise above the button one after another, the nearest first, and "Close" fades in with the scrim.
- Leaving is the same move backwards, and faster. While an overlay leaves it takes no taps or keys. Focus goes back as a menu starts to leave, and as soon as a modal dialog is gone.
- A confirm dialog whose action worked doesn't play its exit; the page move takes it along. Nor does an overlay that its page closes.
- With reduced motion, nothing moves. The tokens already make that 0s.
- One way to play an exit, shared by every overlay. The opened rail, the help, the key, capo and View panels and the docked chord input move onto it from their own code.
- Tooltips stay instant. `docs/motion.md` says so, and adds the panels under their button.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `design-system`: how menus, panels under a button, dialogs and bottom sheets come and go, and that reduced motion covers them.
- `site-layout`: the ways of the "New sheet" menu on a phone rise one after another.

## Impact

- New `apps/web/app/ui/exit.ts` with the shared exit.
- Overlays: `ui/menu.tsx`, `ui/floating-button.tsx`, `ui/confirm-dialog.tsx`, `ui/name-dialog.tsx`, `collections/add-sheets-dialog.tsx`, `collections/choose-collections-dialog.tsx`, `editor/import-button.tsx`, `photos/photo-import-dialog.tsx`.
- Moved onto the shared exit: `shell/edge-panel.tsx`, `editor/panel.ts`, `editor/chord-input.tsx` and `editor/sheet-editor.tsx`, which closes it.
- Their CSS, using the motion tokens only and animating only `opacity`, `scale` and `translate`.
- `docs/motion.md`.
- Unit and e2e tests for coming in, leaving, and reduced motion.

## Open Questions

- Picking another letter while the chord input is open: does it grow again at the new letter, or just jump there?
