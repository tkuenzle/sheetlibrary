# Design

## Context

`ImportButton` on `/editor` holds a text toggle and a native `<dialog>`. Its `ImportForm` reads the pasted text with `readUltimateGuitar` in the browser and passes the sheet to `onImport`, which replaces the page's sheet. The form always shows the note "Importing replaces the sheet on this page." On a phone, `import-button.css` shows only the toggle's icon.

"New sheet" is a plain form posting to the library's action, which calls `createSheet` and redirects to `/sheets/:id?new`. `createSheet` checks neither size nor shape. `POST /api/sheets` does both: it refuses a body over `maxSheetBytes` (256 KB) with 400 "Sheet is too large", checks the sheet with `checkEnvelope`, and answers 201 with the new sheet. Autosave saves through the same API, so a stored sheet over that size could never be saved again.

The boards are "Library, desktop", "Library, phone" and "Library, empty" on the canvas's "Library and account" page: <https://claude.ai/artifact/DcmNjZGDmLtgu7mwb8jyi5>. Each shows "Import" as a tonal button with the `content_paste_go` icon, before the filled "New sheet". On a phone both are large and docked at the bottom right, with their text.

## Goals / Non-Goals

**Goals:**
- No stored sheet is larger than the API accepts.
- A failed import leaves the person in the dialog with their text.

**Non-Goals:**
- Changing the import on `/editor`.
- Importing without scripts. The dialog already needs them.

## Decisions

**The dialog creates the sheet through `POST /api/sheets`, then navigates.** The form reads the text in the browser, as on `/editor`, and the library sends `{ title: "Untitled", content }` as JSON. On 201 the page navigates to `/sheets/:id?new`. A 400 with "Sheet is too large" shows "The text is too long to import." in the dialog. Any other answer, or none, shows "The sheet couldn’t be imported. Try again." Both keep the text. While the request runs, and after it succeeds until the sheet page replaces the library, the dialog's buttons are disabled, as in `ConfirmDialog`. The alternative was posting the text to the library's action and reading it on the server. That would need its own size and shape checks next to the API's, and an action that can't be reached shows the route's error boundary instead of the dialog, which is why delete-sheet went through the API too.

**The size limit is the API's.** It counts the sheet's JSON, not the pasted text. That is what autosave sends later, so any sheet the import creates can be saved again.

**One dialog for both pages.** `ImportButton` gets an optional note, and its `onImport` may return a promise that resolves to an error message. `ImportButton` keeps that state and passes `busy` and `failure` to `ImportForm`, as `ConfirmDialog` does with `ConfirmContent`. `/editor` keeps passing its note and a plain `onImport`. The library passes no note and an `onImport` that calls the API. `ImportButton` takes the toggle's `variant`, `size` and `className`, so the library can show a tonal button, large when docked. The icon-only rule on a phone moves to the top bar's toggle only, so the docked "Import" keeps its text.

**A shared `LibraryImport` in `routes/sheets.tsx`.** It renders `ImportButton` with the library's `onImport`, used next to each of the three "New sheet" buttons. The docked bar becomes one fixed container holding "Import" and "New sheet", 12px apart, instead of the fixed "New sheet" alone.

## Risks / Trade-offs

- [Text close to the limit fails only after "Import".] → The message says why, and the text stays to shorten.
- [A sheet created just before the network drops still opens nowhere.] → It shows in the library at the next visit, titled "Untitled".
