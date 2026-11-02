# Proposal

## Why

The Ultimate Guitar import only replaces the demo sheet on `/editor` (#78). People who are signed in should get a stored sheet from it, in their library.

## What Changes

- The library gets "Import", beside "New sheet": in the heading on a wide screen, in the bar at the bottom on a phone, and in the "No sheets yet" state. It sits before "New sheet", as on the canvas.
- "Import" opens the same dialog as on `/editor`, without the note "Importing replaces the sheet on this page". Nothing is replaced.
- Importing creates a new sheet titled "Untitled" and opens it with the title field open, as "New sheet" does.
- Text too large for a sheet keeps the dialog open with a message. Empty text keeps "Import" disabled, as today.
- `/editor` stays the demo for visitors, with its own import that replaces the sheet on the page.

The look follows the canvas's "Library, desktop", "Library, phone" and "Library, empty" boards (see design.md).

Not part of this change:

- Reading the title or the artist from the pasted text.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `library-page`: "Import" creates a sheet from Ultimate Guitar text, and the empty state offers it too.

## Impact

- `apps/web/app/routes/sheets.tsx`: "Import" in the heading, the docked bar and the empty state.
- `apps/web/app/editor/import-button.tsx`: the dialog works for both pages: the note and the toggle's look become options, and the form hands over the parsed sheet for the page to use.
- `apps/web/app/routes/sheets.css`, `apps/web/app/editor/import-button.css`: the docked bar holds two buttons, and only the top bar's import is icon-only on a phone.
- `docs/ui-text.md`: words for "Import" in the library and its error notes.
- No API change, no migration, no new dependencies.

## Open Questions

- The canvas's empty state adds the line "Start a new sheet, or import one from Ultimate Guitar." under "No sheets yet". Add it?
- When the import can't reach the server, should the spec say what happens? The design keeps the dialog open with "The sheet couldn’t be imported. Try again.", as the delete dialog does.
