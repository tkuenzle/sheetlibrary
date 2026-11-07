# Proposal

## Why

On Android 14 and later, "Add photos" in the import from photos opens the photo picker, which has no camera. So a song in a book can't be photographed from the dialog, though the help line says "Take or pick a photo of each page". On an iPhone, the same button offers both. See #109.

## What Changes

- A "Take photo" button opens the back camera. Each photo taken is added as the next page.
- It shows only where the browser supports taking a photo from a file input, which is phones and tablets. Desktop browsers don't, so they don't show it.
- "Take photo" comes first and stands out more. The button for the library sits next to it, with less weight.
- "Add photos" becomes "Pick photos" everywhere. It still picks several photos at once. On a desktop it is the only button, and looks as "Add photos" does now.
- At 10 pages, both buttons are disabled.
- The words change in `docs/ui-text.md`, and the canvas's "Photo import" note no longer says "Add photos" offers the camera.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `library-page`: the dialog gets "Take photo", and "Add photos" becomes "Pick photos".

## Impact

- `apps/web/app/photos/photo-import-dialog.tsx` and its CSS and tests: the two buttons.
- `apps/web/app/ui/icons.ts`: an icon for the library.
- `docs/ui-text.md`, and the design canvas's "Photo import" page.
- No server change.

## Open Questions

- On Android, opening the camera can make the browser drop the tab when memory is low. The tab reloads, and the pages added so far are gone. Accept this, or park it as an issue?
