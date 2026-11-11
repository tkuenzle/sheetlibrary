# Proposal

## Why

A singer often needs only the words (#96). The play view (#31) always shows the chords, which take room and get in the way of reading the lyrics.

## What Changes

- The play view gets "Lyrics only". It shows the sheet without chords. It changes only what is shown, not what is stored.
- The address keeps it as `?lyrics`, next to `?key` and `?capo`. The page shows lyrics only from its HTML, before JavaScript. A link with `?lyrics` opens lyrics only, which sharing (#36) can use later.
- Lyrics only leaves out the chord rows, so the lines sit close together. Lines of chords only are left out. So is a section with only such lines, label included.
- While lyrics only is on, the key and capo buttons are hidden. The address keeps `?key` and `?capo`, so turning chords back on shows the same key and capo.
- On a wide screen, "Lyrics only" is a toggle before "Smaller text", "Larger text" and "Print" in the top bar. On a phone, it is the first item in the "More" menu, with a check when on, and a "Lyrics only" label shows where the key and capo buttons were.
- Print prints what is shown, so lyrics only prints the lyrics.
- Not in this change: lyrics only in the editor, a default kept on the device, and sharing.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `sheet-view`: the view can show a sheet's lyrics only, without chord rows, lines of chords only, or sections of only such lines.
- `play-page`: the "Lyrics only" toggle, kept in the address, which hides the key and capo buttons, and its place on a phone.

## Impact

- `apps/web/app/sheet-view/`: `SheetView` takes a lyrics-only mode, with its styles and tests.
- `apps/web/app/routes/sheet.tsx` and `sheet.css`: the loader reads `?lyrics`, the toggle, hiding the key and capo buttons, the phone label, and the address following the toggle.
- `apps/web/app/editor/sheet-title.tsx`: the address helper is reused for `?lyrics`.
- `apps/web/app/ui/`: `MenuItem` gets a checked state, and the icon set gets "lyrics" and "check".
- `apps/web/e2e/play.spec.ts`: lyrics only on desktop and phone, after a reload, and in print.
- `docs/ui-text.md`: the toggle, the menu item and the phone label.
- Stored sheets and the API don't change. The design canvas: https://claude.ai/artifact/SpYY7CJ67Wx1C7ekkjaAFq

## Open Questions

- Should "Play" and "Edit" carry `?lyrics` between the pages? As planned, "Edit" drops it, since the editor has no lyrics only, so "Play" from the editor opens with chords.
- Should a tap on the phone's "Lyrics only" label turn the chords back on?
- Should lyrics only start at a larger text size, or use the same steps?
