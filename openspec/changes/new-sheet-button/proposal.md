# Proposal

## Why

There are two buttons for adding a sheet: "Import" (photos, Ultimate Guitar) and "New sheet". They only exist on the Sheets screen, and on a phone both float over the list and cover rows. Issue #133, step 4 of the UX overhaul.

## What Changes

- One "New sheet" button opens a menu with three ways: "Write a new sheet", "From photos…" and "From Ultimate Guitar…". "Import" goes away. The two dialogs stay as they are.
- On wide screens, "New sheet" sits in the rail under the site's name, on every screen in the shell. On middle screens, the compact rail shows it as a square + button under "Open navigation", and the opened rail shows the full button.
- On phones, one square floating button sits above the bottom bar. It is the screen's main add: the "New sheet" menu on Sheets, "New collection" on Collections, and "Add sheets" on a collection. Account has none. It replaces today's docked labeled buttons. An empty screen shows no floating button: the empty library has its cards, and with no collections, or in an empty collection, the button stays in the empty state, as today.
- On a wide screen, the menu opens below "New sheet". Picking a way from the opened rail on a middle screen closes the rail first, so the dialog or the new sheet opens over the page.
- On wide and middle screens, "New collection" and "Add sheets" stay next to their screen's heading.
- The empty library says "Add your first sheet" and shows the three ways as cards, in place of "No sheets yet".
- The wording goes into `docs/ui-text.md`.

Design: the "UX overhaul" page of the design canvas, boards "New sheet: one button, three ways", "Empty library (first sign-in)" and the rail on "Sheets, desktop"; the "Middle screens" page, boards "Sheets, middle" and "The rail, opened".

A sheet started from a collection's page joining that collection is left for #152.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `library-page`: "New sheet" becomes a menu with the three ways, "Import" goes, the empty library shows the three ways as cards, and "New sheet" moves off the Sheets screen into the navigation.
- `site-layout`: "New sheet" in the rail on wide and middle screens, and the screen's floating add button above the bottom bar on phones.

## Impact

- `apps/web/app/routes/shell.tsx`: "New sheet" in all three forms of the rail, the phone's floating button for Sheets, and the photo and Ultimate Guitar dialogs, moved up from `routes/sheets.tsx`.
- `apps/web/app/routes/sheets.tsx` and `sheets.css`: `LibraryImport`, `Actions` and the docked buttons go; the empty library gets the cards.
- `apps/web/app/routes/collections.tsx`, `routes/collection.tsx`: the docked "New collection" and "Add sheets" become the floating button.
- `apps/web/app/ui/nav-rail.tsx`: a place for the button in the rail.
- `apps/web/app/ui/`: the floating button and its menu on phones; the `link` icon.
- `docs/ui-text.md` (Sheets, Collections, A collection, Shell) and `docs/design-direction.md`.
- No change to the import endpoints or the dialogs: the `photo-import` and `ultimate-guitar-import` specs stay as they are.
