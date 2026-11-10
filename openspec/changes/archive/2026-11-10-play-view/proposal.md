# Proposal

## Why

Once a sheet is written, people mostly open it to play it, on a stand or on stage, or print it (#31). Today every sheet opens in the editor, with its tools and small text, and nothing prints cleanly. The read-only sheet view (#23) now makes a clean view possible.

## What Changes

- **BREAKING** A sheet opens to play. `/sheets/:id` becomes the play view, and the editor moves to `/sheets/:id/edit`. A library row opens the play view. "New sheet" and both imports open the editor, as before, with `?new` and `?capo` where they had them.
- The play view shows the title, the artist and the sheet with the read-only sheet view, in larger text. It has no editing tools, and the sheet shows complete before any JavaScript runs.
- A switch, "Play" and "Edit", sits after "Library" in the top bar of both pages. It moves between them and keeps the key and the capo in the address.
- The play view has the key button and the capo button. They change only what is shown and save nothing. The page lays the sheet out again in the browser, without asking the server, and the address follows, as in the editor. The panel doesn't offer to change the song key or to make the shown key the song key.
- "Smaller text" and "Larger text" (A− and A+) change the size of the sheet. The size is kept on the device. On a phone, they sit in a menu with "Print".
- "Print" opens the browser's print, which can also save a PDF. The printed page shows the title, the artist and the sheet as shown, without the page's controls.
- Not in this change: keeping the screen awake, lyrics only (#96), a menu with "Rename" or "Delete" on the play view, and print layout beyond leaving out the controls.

## Capabilities

### New Capabilities

- `play-page`: the page at `/sheets/:id` where the owner plays or prints a sheet: the view, key and capo for the view only, text size and print.

### Modified Capabilities

- `sheet-page`: the editor for a stored sheet moves to `/sheets/:id/edit`.
- `library-page`: a row opens the play view. "New sheet" and the imports open the editor at its new address.
- `site-layout`: the top bar of a sheet's two pages holds the "Play" and "Edit" switch after "Library".

## Impact

- `apps/web/app/routes.ts`: `sheets/:id` points to a new play route, and `sheets/:id/edit` to today's `sheet.tsx`.
- `apps/web/app/routes/`: a new play route with its loader, styles and tests. `sheets.tsx` and `sheets/import.ts` link to the new addresses.
- `apps/web/app/sheet-view/`: the view takes a sheet moved to the shown key and capo, and a font size. Its layout already runs in the browser.
- `apps/web/app/editor/`: `useSheetKey`, `KeyButton` and `CapoButton` are reused on the play view without the editor.
- `apps/web/app/shell/top-bar.tsx`: the switch.
- `apps/web/e2e/`: tests that open `/sheets/:id` to edit move to `/sheets/:id/edit`. New tests for the play view and print.
- `docs/ui-text.md`: the switch, text size and print.
- Stored sheets and the API don't change. Old links to `/sheets/:id` open the play view.

## Open Questions

- Should print always use the light style, even when the page is in lamplight?
- Should the printed page show the key and capo, and page numbers?
- Two columns of sections on wide screens, as on the canvas?
- What does the play view show for a sheet with no lyrics yet? A short note with a link to edit?
