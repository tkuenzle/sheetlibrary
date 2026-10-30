# Proposal

## Why

The chord input is a bare text field. It reads the text only on Done, so the canonical form shows only after the input has closed, and text that isn't a chord gets no feedback until then. Most songs use a handful of chords again and again, but each one has to be typed, which is slow on a phone (#30).

## What Changes

- **Preview.** A line under the field shows the chord as it will be added, as soon as the text reads as one: "Adds **Bbm7**" for `bb-7`, or "Changes D to **(Bbm7)**" when editing. While the text isn't a chord, the line stays blank. The note still shows only on Done.
- **One suggested row.** With the field empty, it shows the chords in this sheet, most used first, then the key's chords that the sheet doesn't use yet. While typing, it narrows to the chords that start with the typed text and adds completions, such as `D` → `D7`, `Dsus4`, `Dm`. Chords not in the sheet yet look different (outlined), with a short legend.
- **Picking.** A click or tap on a suggestion adds it and closes the input. The arrow keys choose one, and Enter adds it. A mark typed in front, as in `(d`, stays on the picked chord.
- **The key** is the one the editor page already has for transposing. For now, that is guessed from the chords. Once sheets store a key (#58), it will be the stored one.
- **Layout.** The field and Done are on top, then the preview, then the suggestions, with Remove and Cancel at the bottom. On a touch device or in a phone-wide window, the input docks at the bottom of the visible area, above the keyboard, like the section toolbar. Docked, it slides up when it opens and down when it closes, as the key picker does on phones, and not at all with reduced motion.
- Chord mode is not needed. It was a spike idea that never shipped, and the "+" below the lyrics, "+ Chord", the toolbar and dragging now cover what it was for.

Building a chord from its parts, with toggles for held and optional chords, is #66. The design for both is on the "Chord input" canvas.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `chord-editor`: the chord input shows a preview and suggestions, and docks on touch devices and phone-wide windows, sliding in and out. With reduced motion, it doesn't slide.

## Impact

- `packages/chordsheet`: a function that lists the chords of a key, and one that ranks suggestions for the typed text from the sheet's chords, the key and common suffixes.
- `packages/chord-editor`: the docking code of the section toolbar is shared with the chord input.
- `apps/web`: the chord input in `sheet-editor.tsx` gets the preview, the suggestion row and the docked layout. `SheetEditor` takes the page's key. Unit and Playwright tests cover them.

## Open Questions

- Should slash chords, such as `D/F#`, be suggested before a `/` is typed? The canvas shows `D/F#` for `d`.
- Is there a limit to how many suggestions show? A sheet can use 20 chords.
- When editing, should empty text preview "Removes D", since Done then removes the chord?
- In a minor key, should both the minor and the major fifth (`Em` and `E` in A minor) be suggested?
