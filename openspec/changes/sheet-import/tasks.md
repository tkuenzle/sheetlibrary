# Tasks

## 1. One dialog for both pages

- [x] 1.1 Give `ImportForm` an optional note and let `onImport` return a promise of an error message: show the message as a `Note` in the dialog, keep the text, and disable the buttons while it runs and after it succeeds. Verify with `import-button.test.tsx`: no note when none is passed, the message after a failed import, buttons disabled while pending
- [x] 1.2 Let `ImportButton` take the toggle's `variant`, `size` and `className`, and limit the icon-only rule on a phone to the top bar's toggle. `/editor` passes its note and keeps its look. Verify with `import-button.test.tsx` and the existing `editor.spec.ts`

## 2. Import in the library

- [x] 2.1 Add the library's import: read the text, `POST /api/sheets` with `{ title: "Untitled", content }`, navigate to `/sheets/:id?new` on 201, and otherwise return "The text is too long to import." for "Sheet is too large" or "The sheet couldn’t be imported. Try again.". Verify with unit tests for 201, the 400 for size, another error and a network failure
- [x] 2.2 Add `LibraryImport` as a tonal "Import" before each "New sheet": in the heading, in the empty state, and docked on a phone, where both buttons share one fixed bar, large, as on the canvas boards. Verify with `sheets.test.tsx` for the scenario "First sign-in" and "Import" beside "New sheet" in the list view
- [x] 2.3 Add "Import" in the library and the two error notes to `docs/ui-text.md`, and say there that the library's dialog has no note

## 3. Checks

- [x] 3.1 Add e2e tests to `library.spec.ts`: import a song and land on "Untitled" with the title field open and the chords in place (scenario "Importing a song"), cancel without a new sheet (scenario "Cancelling"), and paste text over the limit (scenario "Too large")
- [x] 3.2 Look at the library with sheets and without, on a phone and a wide window, and the dialog on both, with the browser-check skill
- [x] 3.3 Run `just check` and `just spec-check`. Verify both pass

## Workflow follow-up

- Close #78 with the pull request. Archive the change after review.
