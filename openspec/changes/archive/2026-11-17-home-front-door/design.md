# Design

## Context

The play view (`routes/sheet.tsx`) already shows a sheet in another key: `useSheetKey` holds the key state, `KeyButton` with `viewOnly` and `CapoButton` change it, and `transposeSheet` draws the chords. `useSheetKey` always writes `key` and `capo` into the address through `useAddressParam`. The home sample today is a static `SheetView` in a tilted box with `aria-hidden`.

## Goals / Non-Goals

**Goals:**
- The sample uses the same key and capo code as the play view, so it can't drift from it.

**Non-Goals:**
- No change to `/editor`, the sign-in page or the top bar.
- No shared heading component with the play view. The card copies the play view's look in its own CSS.

## Decisions

### Reuse the play view's key and capo, without versions

`SampleSheet` calls `useSheetKey` on the sample, renders `KeyButton` with `viewOnly` and no `songPart`, and `CapoButton`, then `SheetView` with the transposed sheet. This is the play view's wiring minus versions and collections. A separate small reducer was considered, but the play view's rules for capo and steps (keep the shapes, move the capo) would have to be copied.

### Keep the key out of the address with an option on `useSheetKey`

`useSheetKey` gets an option to leave the address alone. With it, the hook passes `null` to both `useAddressParam` calls, so the hooks still run in the same order and nothing is written. The home page passes nothing for the address's key and capo, so a shared `/?key=A` shows G. Passing `null` would remove a `key` already in the address, which is harmless on `/`.

### One HTML order, placed with grid areas

The HTML order is: the intro (heading, line, ways in), the card with its caption, then the list of three things. On a wide window, a two-column grid puts the intro and the list in the left column and the card in the right, spanning both rows. Below the wide breakpoint (1024px, as in `app/breakpoints.ts`), it is one column in HTML order. Two columns from 640px, as first planned, leave each column about 350px on an upright tablet, and the verse's lines would wrap in the card. Screen readers read the card before the list at every width, which fits a list that only adds to what the card shows.

## Risks / Trade-offs

- [The card's buttons do nothing until the page's script has loaded] → The same holds on the play view. The card shows in G from the server, so nothing jumps.
- [Two links named "Sign in" on the page, in the top bar and below the line] → Both lead to the same page, so screen readers read no conflict.
