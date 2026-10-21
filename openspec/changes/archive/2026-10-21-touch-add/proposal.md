# Proposal

## Why

On phones, chords can only be moved, not added: there is no hover for the "+" and no Ctrl+K. A single tap rarely hits the intended letter, but the native caret, with its magnifier, does. This is the last part of M2d in `docs/roadmap.md`.

## What Changes

- When a finger places the caret in the active section, a "+ Chord" button shows above the caret, where chords go. It is about 44px tall, so it is easy to tap. It shows once the caret has stopped moving and the finger is lifted, so it doesn't flicker or get in the way while the caret is dragged.
- When there is no room above the caret, at the top of the window, the button shows below it instead.
- Tapping the button opens the chord input at the letter after the caret. On a letter that already has chords, the new chord goes after them, as with the "+" on desktop.
- The button shows only for a plain caret placed by touch, not for a selection. Typing, opening the chord input, or the caret leaving the section hides it. The next tap that moves the caret shows it again.
- Desktop doesn't change.
- The button is tried on Android with the preview link. No iPhone was at hand, so the iPhone pass, of the button and the existing editor, becomes a step before M2f in the roadmap.
- `docs/roadmap.md`: touch-add is marked done, with the approach. The "Add after" button in the chord input is no longer part of touch-add, because the button adds to piles on phones. It stays as an idea for keyboard users. M2f starts with the iPhone pass.

Out of scope: a toolbar, an "Add after" button, adding at a selection, adding by dragging a "+", and trying it on an iPhone.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `chord-editor`: chords can be added by touch, with a "+ Chord" button at the caret.

## Impact

- `packages/chord-editor`: the chord layer shows the button and hides it again, places it clear of the keyboard, and calls `onAddChord`. The stylesheet gets the button.
- `apps/web`: the sheet editor already opens the chord input from `onAddChord`. The Playwright tests for `/sheet-editor` cover the button on the phone project.
- `docs/roadmap.md`: as above.

## Open Questions

- With a Bluetooth keyboard on a phone, should the arrow keys move the button with the caret? For now, any key hides it.
- Should the button hide while the page scrolls? For now, it moves with the text.
