# Proposal

## Why

Sections can only be moved by cut and paste. This is M2e in `docs/roadmap.md`. The roadmap planned dragging, but dragging a whole section on a phone is awkward: the section is often taller than the screen, and the drop spots get lost under it. Buttons are simpler and work the same for mouse and touch.

Move buttons above the section collided with the floating "+ Chord" button from touch-add: at the end of a section's first line, "+ Chord" opened under them. So this change gathers the active section's actions in one toolbar, instead of adding another floating part. That also replaces touch-add's floating button, which is why both are in one change.

## What Changes

- The active section has a toolbar with "+ Chord", "move up" and "move down". Other sections have none.
- With a mouse, the toolbar sits at the right edge above the active section, which gets room for it. On a touch device, it is docked at the bottom of the visible area, above the keyboard when it is open. Which one is decided by the device's main pointer, not the screen width.
- "+ Chord" opens the chord input for the letter after the caret, or after the end of a selection where the caret is. The chord goes after any chords already on the letter.
- "Move up" and "move down" swap the section with the one before or after. In the first section, "move up" is disabled; in the last, "move down" is. With a single section, they are hidden.
- The moved section stays active, with the caret at the same spot in its text. It is not cleaned up, since the caret doesn't leave it. One undo puts it back and makes it active.
- With a mouse, the page scrolls after a move so the buttons stay under the pointer. On a touch device, the docked toolbar doesn't move, and the page keeps the caret in view.
- Pressing a toolbar button doesn't take focus from the editor.
- The docked toolbar never covers the caret.
- **BREAKING** for touch-add: the floating "+ Chord" button above the caret goes, with its timing rules, the `--chord-editor-add-offset` property and the `?add-offset` parameter of `/sheet-editor`. The "+" below the lyrics for the mouse and Ctrl+K stay.
- `docs/roadmap.md`: M2e becomes the section toolbar. Dragging sections moves to "Later". A new "Later" item plans keyboard shortcuts as a whole: adding chords, adding to a pile, moving sections. M2f's iPhone check covers the docked toolbar instead of the floating button.

Out of scope: dragging sections, keyboard shortcuts, and toolbars on dimmed sections.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `chord-editor`: the active section gets a toolbar to add chords and move the section. The floating "+ Chord" button for touch is removed.

## Impact

- `packages/chord-editor`: a command that moves the active section, and the toolbar that calls it and `onAddChord`. The chord layer loses the floating button. The stylesheet gets the toolbar and room for it above the active section with a mouse.
- `apps/web`: the hint on `/sheet-editor` mentions the toolbar, and `?add-offset` goes. Playwright tests cover the toolbar on the desktop and phone projects; the floating button's tests go.
- `docs/roadmap.md`: as above.

## Open Questions

- Should the docked toolbar hide while the chord input is open?
- Should the iPhone check also cover scrolling with the keyboard open, where the docked toolbar may lag behind?
