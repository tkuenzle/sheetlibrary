# Proposal

## Why

Many songs live in paper songbooks, and typing them in by hand takes long. #105 reads photos of a song into a chord sheet on the server. This change adds the UI in the library, so a person can take photos and get a sheet to check in the editor.

## What Changes

- In the library, "Import" opens a menu with "From photos…" and "From Ultimate Guitar…". The Ultimate Guitar dialog stays as it is, and so does the editor page.
- "From photos…" opens a dialog to take or pick photos of each page. They are listed in the order they were added, and each can be removed. There is no reordering. At most 10 pages.
- A photo the browser can't open gets a note on its row, and Import waits until it is removed.
- The browser shrinks each photo and turns it upright before it sends it.
- While it works, the dialog shows the upload in percent, then "Reading the pages" with the time so far. Cancel works the whole time and stops the reading.
- When the reading fails, the dialog keeps the photos and says so, and Import tries again.
- The new sheet takes the title and the artist read from the page, and opens. Without a title, it is "Untitled" with the title field open, as the Ultimate Guitar import does.
- The words go into `docs/ui-text.md`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `library-page`: "Import" becomes a menu, and the import from photos is added.
- `photo-import`: the server refuses more than 10 photos.

## Impact

- `apps/web/app/routes/sheets.tsx`: the Import menu and the photo dialog.
- `apps/web/app/ui/menu.tsx`: a menu opened from a button with text, not only an icon.
- A new dialog component, the photo shrinking, and the upload with progress, under `apps/web/app/photos/`.
- `apps/web/app/sheets/import.ts`: create a sheet with a title and an artist.
- `apps/web/e2e/library.spec.ts`: the Ultimate Guitar import is now behind the menu.
- `apps/web/app/photos/photo-import.server.ts`: refuse more than 10 photos. `POST /api/sheets` is used as it is.

## Open Questions

- The sheet read from the photos is too large to save. Say the same as a failed reading, or something of its own?
- The session has ended by the time Import is pressed. Is the general failure enough?
- The model reads no lines at all, such as from a photo of a cat. Open an empty sheet, or say nothing was found?
- On a phone, the menu opens above the buttons at the bottom and the dialog is a sheet from the bottom, as on the canvas. Anything more?
