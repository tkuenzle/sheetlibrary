# Proposal

## Why

On an empty library, the import dialogs have centred text: the title, the help line, and "Page 1" in the middle of its row (#112). With sheets in the library, the text is aligned to the start, as on the canvas. The dialogs sit inside the "No sheets yet" section, which centres its text, and a modal dialog still inherits styles from where it sits in the page.

## What Changes

- The "No sheets yet" section no longer centres all the text inside it. Only its heading is centred. The buttons stay centred, as they are already placed by the section's layout.
- The import dialogs ("From photos…" and "From Ultimate Guitar…") look the same whether the library is empty or not.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The specs don't say how text in the dialogs is aligned, so this is a fix with no spec change.

## Impact

- `apps/web/app/routes/sheets.css`: `.library-empty`, and `.library-empty h2`, which becomes `.library-empty > h2`. The dialog titles are `h2`s inside the section too, so the old rule also centred them and set their font.

## Open Questions

- Should something guard against this coming back, such as a test or a comment? For now, it's only the CSS fix.
