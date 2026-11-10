# Design

## Context

The read-only sheet view (`apps/web/app/sheet-view/`) renders on the server with no JavaScript. Its `layoutSheet(sheet, widths)` is pure, and its width table is 14 KB (3.3 KB gzipped). So the same layout can run in the browser.

The key and capo state is already separate from the editor. `useSheetKey` and `loadSheetKey` (`editor/sheet-title.tsx`) only read the sheet, and they keep `?key` and `?capo` in the address with `replaceState`. `SheetTitle` is the only piece tied to the editor, through its `editor` ref.

The UX was worked out on a design canvas: https://claude.ai/artifact/SuoBiearkVkEbj3vLz9Fxp

## Goals / Non-Goals

**Goals:**
- The server HTML of the play view is complete in the address's key and capo, at the device's text size.
- A transpose, a capo or a text size change on the play view needs no request.

**Non-Goals:**
- Sharing the editor page's components beyond the key and capo buttons.
- Print layout beyond hiding the controls. The view already keeps lines together across pages.

## Decisions

### Two routes, files named after their addresses

`routes.ts` maps `sheets/:id` to a new `routes/sheet.tsx` (play) and `sheets/:id/edit` to `routes/sheet.edit.tsx`, which is today's `sheet.tsx` moved with its CSS and tests (`git mv`). Both loaders read the sheet the same way, with the same redirect and 404.

Alternative: keep `sheet.tsx` as the editor and add `sheet.play.tsx`. Less moving, but the file for `/sheets/:id` would then be the editor.

### The switch is two links

"Play" and "Edit" are two `<a>` in the top bar, styled as one switch, with `aria-current="page"` on the current one. A full page load is fine: it is what "Library" does today, so the editor's unsaved-edits prompt still works, and the play view never loads the editor's code. Each link's `href` carries the current `?key` and `?capo`, so it follows a transpose made after the page loaded.

### Laying the sheet out again in the browser

The play route renders `useSheetKey(sheet.content, key, capo)`. From its `key` and `drawn`, the page moves the sheet's chords to the drawn key and passes that sheet to `SheetView`. On the server this gives the first HTML. In the browser, a pick in the key or capo panel changes the state, React renders again, and `layoutSheet` works out the new room for the chords. Transposing changes the chord names' widths, so the room and dashes have to be worked out again. Swapping only the names isn't enough.

Moving a whole sheet gets a helper in `chordsheet`, `transposeSheet(sheet, from, to)`. `soundingSheet` uses it too.

Alternative: navigate to the new address and let the loader render. Rejected: it is the server round trip the play view should avoid.

### A key panel for viewing only

`KeyButton` gets a `viewOnly` mode. It hides "Change" and "Make … the song key", and leaves out undo. Its `readOnly` mode stays as it is for the editor's conflict state, where "Change" shows disabled. `CapoButton` is used as it is. The play view doesn't use `SheetTitle`, since it needs no editor ref.

### Text size in a cookie

The size is a step from −2 to +3, kept in a cookie (`play-text-size`) like the passkey offer's (`auth/passkey-offer.ts`). The loader reads it, so the server renders the right size and nothing moves after load. With `localStorage`, the sheet would first render at the default size and then wrap again.

The step scales a base size: `--sheet-view-font-size: calc(var(--play-text-base) * <scale>)`. The base is 24px on a wide screen and 20px on a phone, so one step works at both widths. The scales are 0.8, 0.9, 1, 1.15, 1.3 and 1.5. The view's sizes are all in em, so the layout needs no change. "Smaller text" and "Larger text" are disabled at the ends.

### Print styles

The play route's CSS gets an `@media print` block that hides the top bar and every button, and drops the page's background and margins. The title, the artist and the view stay. "Print" calls `window.print()`.

### The phone's menu

On a phone, the text size and "Print" move into a menu, using the existing `Menu` component, after the key and capo buttons. The switch shows only its icons, with `aria-label`s, and the title moves out of the top bar into the page.

## Risks / Trade-offs

- [The browser runs the layout for every pick] → It is a loop over a few hundred letters with a table lookup each. No measurement needed.
- [Old links to `/sheets/:id` now open the play view] → Intended. The editor is one tap away.
- [e2e tests open `/sheets/:id` to edit] → They move to `/sheets/:id/edit` in the same change.
- [The play view now loads JavaScript for its controls] → The sheet still shows complete without it. Only the buttons need it.
