# Proposal

## Why

"New sheet" creates a sheet titled "Untitled", and the sheet page can't change it, so every new sheet stays "Untitled" in the library (#76). The title has to be changeable on the sheet itself, and so does the artist.

## What Changes

- On the sheet page, a click on the title turns it into a field. Enter or a click elsewhere keeps the new title; Escape goes back to the old one. A title that is empty once trimmed becomes "Untitled".
- The artist shows below the title. Without one, "Add artist" shows there and turns into a field the same way. An artist that is empty once trimmed is removed, and "Add artist" shows again.
- The title and the artist take up to 100 characters. The server refuses longer ones.
- A kept title or artist saves with the sheet, like any other edit, and the save status covers it. Renaming is not part of the editor's undo.
- The heading and the browser tab follow the new title.
- The sheet's menu sits beside the title. For now it holds only "Rename", which opens the title field.
- "New sheet" opens the new sheet with the title field open and "Untitled" selected, so typing names it.
- When the sheet changed in another tab, the title, the artist and "Rename" become read-only along with the editor.
- The sheet page's help gets a line for renaming. The help on `/editor` doesn't, since its title stays fixed.

This reverses "The title SHALL NOT be editable here" in the sheet-page spec. The look follows the canvas's "Library and account" page (see design.md).

Not part of this change:

- "Delete" in the sheet's menu (#77).
- The breadcrumb in the top bar keeps the title the page was loaded with. #79 removes it.
- Renaming from the library.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `sheet-page`: the title becomes editable, the artist shows and can be added, changed or removed, the page gets the sheet's menu, and all of it turns read-only after a conflict.
- `library-page`: "New sheet" opens with the title field open.
- `sheet-envelope`: the title and the artist are at most 100 characters.

## Impact

- `apps/web/app/routes/sheet.tsx`: the title and artist live in the page's state and go out with each save.
- `apps/web/app/editor/sheet-title.tsx`: the heading becomes a field on click, and room for the artist and the menu.
- `apps/web/app/sheets/autosave.ts`: saves send the current title and artist instead of the loaded ones.
- `apps/web/app/routes/sheets.tsx`: "New sheet" tells the sheet page to open the title field.
- `packages/chordsheet/src/sheet-envelope.ts`: the length limit, which the API's check already applies.
- `apps/web/app/ui/`: a small menu, the first in the app.
- `apps/web/app/editor/help.tsx`: the line for renaming, on the sheet page only.
- `docs/ui-text.md`: words for the title, the artist and the menu.
- No migration, no new dependencies.

## Open Questions

- On a phone, the menu is pinned to the top right of the heading, and the title wraps beside it (proposed, not yet confirmed).
