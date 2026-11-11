# Tasks

## 1. The key a version shows

- [x] 1.1 Add a `chordsheet` helper that gives the key a version shows on a sheet: its own key, or the relative key when major or minor differs, spelled as the keys to move to, keeping the sharp or flat on a tie. Verify with tests for A on Em (F#m), F#m on G (A), Gb on a minor sheet (Ebm), F# on a minor sheet (D#m) and A on G (A).

## 2. Storing versions

- [x] 2.1 Add `migrations/0004_sheet_versions.sql` with the `sheet_version` table, its cascade from `sheet` and its index. Verify `just migrate-local` applies it, and `migrations.server.test.ts` passes.
- [x] 2.2 Add list, create, rename, change key and delete to `sheets.server.ts`, each joined on the sheet's owner, the list ordered by when each was saved. Verify with `sheets.server.test.ts` cases: someone else's version is not found, saving a version leaves the sheet's revision, deleting a sheet deletes its versions, and an empty or 41-character name is refused.
- [x] 2.3 Add the API at `/api/sheets/:id/versions` and `/api/sheets/:id/versions/:versionId` in `routes.ts`, with handlers in `sheets-api.server.ts`. Verify with `sheets-api.server.test.ts` cases for each method, 401, 404, and 400 for a name or key that isn't valid.
- [x] 2.4 Add browser helpers in `sheets/versions.ts` for save, rename, change key and delete, throwing when the server can't be reached or refuses. Verify with `versions.test.ts` against a stubbed fetch.

## 3. Opening a version

- [x] 3.1 Read the versions with the sheet in the play loader, resolve `?version`, and redirect an unknown version to the address without `version` and `key`. Verify with `sheet.test.tsx` cases: the server HTML is in the version's key, `key` next to it wins, and an unknown version redirects keeping `capo` and `lyrics`.
- [x] 3.2 Give `useSheetKey` a `home` key: `key` in the address only when the shown key differs from it, and "Back to" names it. Verify with `sheet-title.test.tsx` cases for the address and for showing home again.
- [x] 3.3 Show the version's name after the artist, or alone without an artist, also with lyrics only and in print. Verify with `sheet.test.tsx` cases for both, and that the print styles keep it.
- [x] 3.4 Carry the drawn key in the Play/Edit switch's query, so "Edit" from a version opens the editor in its key. Verify with a `sheet.test.tsx` case for the link.

## 4. Versions in the key panel

- [x] 4.1 Add `songPart` to `KeyButton`'s `viewOnly` mode, replacing the "Song key" block. Verify `key-button.test.tsx` passes unchanged for the editor, with a case for a passed part.
- [x] 4.2 Without versions, pass the song key block with a "…" holding "Save A as a version…", named for the shown key. Verify with a `sheet.test.tsx` case.
- [x] 4.3 With versions, pass the list: "Song key" first, then each version, the open one or "Song key" marked with `aria-current`, "Save … as a version…" at the end, and a scroll after about four rows. Picking a row opens it without a page load, and the address follows. Verify with `sheet.test.tsx` cases for the marked row and for switching.
- [x] 4.4 Add the open version's "…" menu: "Make Bb Anna's key" only while shown in another key, "Rename…" and "Delete…". Verify with `sheet.test.tsx` cases in and out of the version's key.

## 5. Saving, renaming and deleting

- [x] 5.1 Add `NameDialog` to `ui/`, built like `ConfirmDialog`: a field of at most 40 characters, selected at first, Enter saves, "Cancel" and Escape close, the buttons disabled while saving, and a note when it fails. Verify with `name-dialog.test.tsx`.
- [x] 5.2 Save a version from the dialog, filled in with "Key A", and open it. Rename one from its menu, with its name filled in. "Make Bb Anna's key" stores the shown key and drops `key` from the address. Verify with `sheet.test.tsx` cases against a stubbed fetch.
- [x] 5.3 Delete a version after `ConfirmDialog`, naming it and saying the sheet stays as it is. Afterwards the sheet stays in the key it was shown in, without a version. Verify with a `sheet.test.tsx` case.
- [x] 5.4 Add e2e tests to `e2e/play.spec.ts`: save a version and reload its address, try another key and go back, make a new key, rename, delete and open the old bookmark, and the panel and list on a phone. Verify they pass.
- [x] 5.5 Add versions to `docs/ui-text.md`: the "…" beside the song key, the list, the version's menu, the dialog and the confirmation, and "version" in the glossary. Verify the words match the page.

## 6. In a browser

- [x] 6.1 With the `browser-check` skill, save, switch, rename and delete versions at desktop and phone width, in light and lamplight. Verify against the design canvas, and that the phone's panel fits with three versions.
- [x] 6.2 Run `pnpm test`, `pnpm typecheck`, the linter and the e2e suite. Verify all pass.

## Workflow follow-up

- Open issues for the proposal's open questions the user wants to keep, after asking the user.
