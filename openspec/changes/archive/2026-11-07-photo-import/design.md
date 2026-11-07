# Design

## Context

`POST /api/photo-import` (#105) takes `multipart/form-data` with one `photo` field per page and answers `{ content, title?, artist? }`. When the request is aborted, the model call stops too. `importSheet` in `app/sheets/import.ts` creates a sheet through `/api/sheets`, always as "Untitled". `ImportButton` holds the Ultimate Guitar dialog: a native `<dialog>` that ignores Escape and the backdrop while busy. `Menu` in `app/ui/menu.tsx` only opens from an icon button, under it at its right edge. The design is on the canvas's "Photo import" page; `docs/ui-text.md` wins for the words.

## Goals / Non-Goals

**Goals:**
- One request per import, with real upload progress, and Cancel that reaches the model.

**Non-Goals:**
- Choosing the model, the effort or the final photo size. That is #102.
- Reordering pages, the photo next to the editor (#99), a whole book (#100).

## Decisions

**Upload with `XMLHttpRequest`, not `fetch`.** Only `xhr.upload.onprogress` reports upload progress in every browser; `fetch` with a streamed body works in Chromium only and needs HTTP/2. When `xhr.upload` fires `load`, the dialog switches from percent to "Reading the pages…" and starts its clock. Cancel calls `xhr.abort()`, which ends the request, so the Worker's `request.signal` stops the model. The upload sits behind a small function, `(photos, onProgress, signal) => Promise<answer>`, so the dialog's tests pass a fake.

**Shrink each photo when it is added, not at Import.** `createImageBitmap(file)` decodes it and turns it upright from its orientation tag (the default, `imageOrientation: "from-image"`). It is drawn to a canvas at most 2236 px on the long edge, never enlarged, and saved as JPEG at quality 0.9. Doing this at add time does three things: a photo the browser can't decode, such as HEIC on a desktop, gets its note right away; the thumbnail comes from the shrunk JPEG; and "Try again" sends the same shrunk files without decoding again. The size is one constant, so #102 can change it.

**The dialog is its own component, not `ImportButton`.** `ImportButton` blocks Escape while busy; the photo dialog must let Cancel, Escape and the backdrop work the whole time and abort. The two share only `<dialog>` and the button styles. The dialog's states (pages, uploading with percent, reading with seconds, failed) live in a reducer in a plain module, tested without a browser.

**`importSheet` takes the title and the artist.** `importSheet(content, { title, artist })`, with "Untitled" when there is no title and no artist field when there is none. The library opens `/sheets/:id` when a title was read, and `/sheets/:id?new` when not. The Ultimate Guitar import keeps calling it as now.

**`Menu` gains a button with text and a placement.** A `text` prop shows the label with a trailing chevron in a tonal button, as on the canvas. A `placement` prop opens the list under the button at its left edge, or above it for the docked buttons on a phone. The keyboard handling stays as it is.

**One limit for the browser and the server.** `MAX_PHOTOS = 10` lives in a module both import, so the dialog and `handlePhotoImport` can't drift apart. The server answers `400` for more, before it calls the model; the dialog never sends that many, so it shows the general failure if it ever happens.

**The fake model covers the end-to-end test.** The Playwright test adds JPEG fixtures with `setInputFiles` and gets "Amazing Grace" from the fake. A file of random bytes named `.jpg` stands in for a photo that can't be opened. The fake answers no artist, so the artist is checked in unit tests.

## Risks / Trade-offs

- [Shrinking a 12-megapixel photo on an old phone takes memory and a moment] → Shrink one photo at a time, and close each bitmap once it is drawn.
- [Safari's `createImageBitmap` reads the orientation tag only in recent versions] → Check on an iPhone with a sideways photo before merge.
