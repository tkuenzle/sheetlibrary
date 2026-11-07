# Tasks

## 1. The Import menu

- [x] 1.1 Give `Menu` a `text` prop (a tonal button with the label and a trailing chevron) and a `placement` prop (under at the left edge, or above); verify with `menu.test.tsx` for both and the keyboard tests still passing
- [x] 1.2 Add the icons `photoCamera`, `addAPhoto` and `image` to `app/ui/icons.ts`; verify with `icon.test.tsx`
- [x] 1.3 In the library, make "Import" a menu with "From photos…" and "From Ultimate Guitar…", opening above the docked buttons on a phone; "From Ultimate Guitar…" opens the dialog as now; update `e2e/library.spec.ts` for the menu and verify the "Import from Ultimate Guitar" scenarios pass with `just e2e`
- [x] 1.4 Write the menu's words in `docs/ui-text.md` under Library; verify the page has them

## 2. Photos in the browser

- [x] 2.1 Add `MAX_PHOTOS` (10) in a module the browser and server share, and make `handlePhotoImport` answer `400` for more, before calling the model; verify with a test in `photo-import.server.test.ts` that 11 photos are refused and the model isn't called
- [x] 2.2 Add the shrinking in `app/photos/`: decode with `createImageBitmap`, draw at most 2236 px on the long edge, never enlarged, save as JPEG at 0.9, and report a photo that can't be decoded; verify with tests for the size, a small photo left as is, and a file that isn't an image
- [x] 2.3 Add the upload over `XMLHttpRequest` to `/api/photo-import`: one `photo` field per page, upload progress, a signal that aborts it, and the answer or a failure; verify with tests on a fake `XMLHttpRequest` for the form, progress, abort and a non-200 answer
- [x] 2.4 Let `importSheet` take a title and an artist, with "Untitled" when there is no title; verify with `import.test.ts` for both and the Ultimate Guitar call unchanged

## 3. The photo dialog

- [x] 3.1 Add the dialog's state as a reducer: pages in order, add up to 10, remove, a page that can't be opened, uploading with percent, reading with seconds, failed; verify with tests for each spec scenario under "The photos in the dialog", "A photo that can't be opened", "Progress while reading" and "Reading that didn't work"
- [x] 3.2 Build the dialog as on the canvas: "Add photos" (a file input for images, several at once), rows with thumbnail, "Page n" and remove, the note for a photo that can't be opened, the count, the progress, Cancel and Import; a sheet from the bottom on a phone; verify with a component test for the states and a check in the browser at desktop and phone width
- [x] 3.3 Make Cancel, Escape and the backdrop close the dialog at any time and abort the upload or the reading; verify with a component test that the signal is aborted and no sheet is created
- [x] 3.4 On an answer, create the sheet with its title and artist and open `/sheets/:id`, or `/sheets/:id?new` without a title; on a failure, keep the pages and say so, and let Import send the same photos again; verify with component tests for both, using a fake upload
- [x] 3.5 Write the dialog's words in `docs/ui-text.md`; verify the dialog's text matches the page
- [x] 3.6 Add an end-to-end test: open "From photos…", add two JPEG fixtures, import, and see "Amazing Grace" open; and one with a file that isn't an image that disables Import until it is removed; verify with `just e2e`

## 4. Checks

- [x] 4.1 Run `just check`; verify it passes
- [x] 4.2 On the preview, import a real songbook song from an iPhone and from a desktop, including a sideways photo and a HEIC on the desktop; verify the sheet opens upright and right, and the HEIC gets its note
- [x] 4.3 On the preview, cancel while the pages are read; verify in the gateway's analytics that the call ended early

## Workflow follow-up

- Open the pull request that closes #93.
- Archive the change once it is merged.
