# Design

## Context

The play view (`routes/sheet.tsx`) renders `SheetView` from `useSheetKey`, which reads `?key` and `?capo` once and keeps them in the address with `useAddressParam` (`editor/sheet-title.tsx`). The text size and "Print" are icon buttons in the top bar, and a `Menu` on a phone. `MenuItem` has no checked state.

The UX was worked out on a design canvas (option A): https://claude.ai/artifact/SpYY7CJ67Wx1C7ekkjaAFq

## Goals / Non-Goals

**Goals:**
- The server HTML is complete in lyrics only when the address holds `lyrics`.
- Turning lyrics only on or off needs no request.

**Non-Goals:**
- Lyrics only in the editor, or carried by the "Play" and "Edit" switch.

## Decisions

### Lyrics only is a mode of SheetView

`SheetView` takes `lyricsOnly`. In that mode it skips `layoutSheet` and renders each section's label and each line's text as a plain `<p>`, so the browser wraps it as normal text. It drops lines whose text is only spaces, and sections left with no lines. The section labels and gaps keep the full view's classes, so both modes look the same apart from the chords.

Alternative: keep `layoutSheet` and hide the chord rows with CSS. Rejected: the pieces would still get the room and dashes the chords need.

### The page keeps the state, the address follows

`PlayView` keeps `lyricsOnly` in its own state, from the loader's `url.searchParams.has("lyrics")`. It is not part of `useSheetKey`, since it doesn't touch the key. `useAddressParam` is exported and learns to write a flag: `lyrics` with no `=`, so the address reads `?key=A&lyrics`. Reading uses `has`, so `?lyrics=` and `?lyrics=1` work too.

The "Edit" link keeps using `keyQuery`, which doesn't know `lyrics`, so the editor opens with key and capo only.

### The toggle

On a wide screen, the toggle is a `Button` with its "lyrics" icon and the name "Lyrics only", and `aria-pressed`. Off, it is outlined. On, it is tonal and its icon becomes a check. The play view's CSS gives it these two looks, since the button has no outlined variant. A divider separates it from the text size and "Print".

On a phone, `MenuItem` gets an optional `checked`. An item with it is a `menuitemcheckbox` with `aria-checked`, and shows a check after its name when on. "Lyrics only" is the first item, followed by a divider. The phone's "Lyrics only" label is a plain `<span>`, shown only up to `phoneMaxWidth` and hidden in print.

The icons "lyrics" and "check" come from Material Symbols Rounded, as `ui/icons.ts` describes.

## Risks / Trade-offs

- [A link from the library opens with chords, even for a singer who always wants lyrics only] → Intended for now. A default kept on the device can come later on top of the address.
- [`?lyrics` without `=` is written by hand] → The flag is the only such parameter. A unit test covers writing and reading it.
