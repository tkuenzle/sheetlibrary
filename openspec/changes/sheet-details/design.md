# Design

## Context

`PUT /api/sheets/:id` already stores the title and artist it is sent. The client never changes them: `Autosave` builds each save from the sheet as loaded, with only the content read fresh from the editor. The editor's undo history covers the content only. The title is an `<h1>` in `SheetTitle`, outside the editor. Section labels are already edited in place by `SectionLabelField`, which keeps on Enter or blur and cancels on Escape. The key button's panel closes on a click outside or on Escape.

The boards are on the canvas's "Library and account" page: <https://claude.ai/artifact/DcmNjZGDmLtgu7mwb8jyi5>. For this change: "New sheet: opens as Untitled, title edited in place" and "The sheet's menu". "Delete" on the menu board waits for #77; the "← Library" top bar and the account initial wait for #79.

## Decisions

**One save loop for content and details.** `SheetView` keeps the title and artist in its state. Autosave's `read` returns the whole sheet to save, `{ title, artist, content }`, instead of the content alone, and a kept title or artist calls `edited()` once if it changed. A separate request for the details was the alternative. It would bump the revision on its own, so the next content save would get a 409 from its own tab, and the page would need two save states.

**Renaming stays out of the editor's undo.** Undo in the editor walks back lyrics and chords. A rename in that history would make Cmd+Z in a section quietly change the title, far from the caret, and would mean feeding outside steps into the editor's history. While typing, the field's own undo works, and Escape cancels the rename.

**The fields follow the section label's rules.** A shared field component for the title and artist keeps on Enter or blur, cancels on Escape and guards against keeping twice, as `SectionLabelField` does. Text is trimmed. An empty title becomes "Untitled"; an empty artist is left out of the saved sheet, as the envelope requires. The field takes the heading's font, so the title doesn't jump when it opens. Opening it selects the whole text, from a click and from "Rename".

**The limit lives in the envelope check.** `TITLE_MAX` and `ARTIST_MAX` (100) sit in the `chordsheet` package beside `LABEL_MAX`, and `checkEnvelope` reports longer text. The API runs that check on every create and save, so it refuses them with no API code of its own. The fields set `maxLength` from the same constants.

**"New sheet" opens the field through the URL.** The library's action redirects to `/sheets/:id?new`. The sheet page opens the title field with "Untitled" selected when it sees `new`, then drops it from the URL with `history.replaceState`, so a reload or a later visit doesn't open the field. Guessing from the sheet itself ("Untitled" with no lyrics) was the alternative. It would reopen the field on every visit until the sheet is named.

**Read-only covers the details.** The page already passes `readOnly` to the editor and `SheetTitle` after a 409. The title and artist buttons and "Rename" get it too. A field that is open when the conflict comes closes without keeping, since its save could never go through.

**The title is a button inside the heading.** `<h1><button>Amazing Grace</button></h1>` keeps the page's heading for screen readers and lets the keyboard reach the rename. "Add artist" and the artist are buttons too.

**The tab title follows the state.** `meta()` reads the loader's data, which doesn't change on a rename. The page sets `document.title` from its state after a rename. The breadcrumb in the top bar keeps the loaded title until #79 removes it.

**A small menu in `ui/`.** There is no menu in the app yet. `Menu` is a button ("More for this sheet", icon `more_vert`) with `aria-haspopup` and `aria-expanded`, and a `Popover` with `role="menu"` and `menuitem` buttons. It opens with the first item focused, arrow keys move between items, and a click outside or Escape closes it, with focus back on the button, as the key button's panel does. #77 adds "Delete" to it. The icons `more_vert` and `edit` join `icons.ts`.

**The help line is a prop.** `EditorHelp` takes an option for the rename line, which the sheet page turns on and `/editor` leaves off.

## Risks / Trade-offs

- [A rename can't be undone once kept.] → Typing the old title again is cheap, and Escape cancels before it is kept.
- [The breadcrumb shows the old title until #79.] → #79 is planned in M4 and removes the breadcrumb from the sheet page.
- [A stored sheet with a title over 100 characters would fail every save from now on, and the page would keep retrying.] → Only the API could have made one. Check production for such titles or artists before merging.
