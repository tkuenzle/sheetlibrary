# Tasks

## 1. The key in the model

- [x] 1.1 Add an optional `key` (a `Key`) to `ChordSheet` in `packages/chordsheet/src/sheet.ts`; verify the type check passes
- [x] 1.2 In `checkSheet`, report a key whose tonic isn't a note or whose `minor` isn't a boolean; verify with tests in `check.test.ts` for a valid key, a tonic "H" and a missing `minor`

## 2. The key in the editor document

- [x] 2.1 Give the `doc` node a `key` attribute, default `null`, filled by `docFromSheet` and written back by `handBackSheet`, and left out when `null`; verify with round-trip tests in `adapter.test.ts`, with and without a key
- [x] 2.2 Add a command that sets the key with `setDocAttribute`; verify with a test that it moves no chord and that undo brings the old key back
- [x] 2.3 Let a transpose take the new key and set it in the same transaction when the document has a set key; verify with tests that a set key moves with the chords, and that a document without one keeps `null`

## 3. The key button and panel

- [x] 3.1 Expose setting the key on `SheetEditorHandle`, and pass the transpose's target key through `SheetTitle`; verify the type check passes
- [x] 3.2 Report the set key with the chords to `useSheetKey`, which uses it before the guess and takes the original from the loaded sheet's set key when it has one; verify with tests that a set key wins, stays after the chords change, and becomes the original
- [x] 3.3 In the panel, say "The original key, G, is guessed from the chords." only for a guessed key, and "The original key is G." otherwise; verify with `key-button.test.tsx`
- [x] 3.4 Add "Change" beside the original key. It shows the major and the minor keys, with the sheet's key marked, and Cancel. A pick sets the key and goes back to the keys to move to. Verify with `key-button.test.tsx`, and in the browser at desktop width and as a bottom sheet on a phone
- [x] 3.5 Show the key button for a sheet without chords when it has a set key; verify with a test
- [x] 3.6 Update the key button's words in `docs/ui-text.md`; verify they match the panel
- [x] 3.7 Add e2e tests to `editor.spec.ts`: setting the seed song to Em moves no chord, shows "Key Em", and keeps it after every chord is removed; verify `just e2e` passes
- [x] 3.8 Add an e2e test on the sheet page: set the key, wait for "Saved", reload, and the button reads the set key and the panel doesn't say it was guessed; verify `just e2e` passes

## 4. Checks

- [x] 4.1 Run `just check`; verify it passes. One photo-import dialog test failed once with an error page on `/sheets`, then passed 6 times on its own and in a second full `just e2e` run
- [x] 4.2 With the browser-check skill, on `/editor` and on a stored sheet: set a key, transpose, undo, and "Back"; verify the button and the panel follow each step. Checked by hand on `/editor` at desktop width and on a Pixel 7. The stored sheet only through its e2e test: the saved e2e session wasn't accepted by a separate preview. This check found that undoing a set key left the old original key behind, fixed by keeping the original key in the document (design.md)

## 5. A clearer panel

- [x] 5.1 Split the panel into "Song key", with the sheet's key and "Guessed from the chords" while none is set, and "Transpose to" below a divider; name the dialog "Key". Verify with `key-button.test.tsx`
- [x] 5.2 In the Change view, say "Pick the key the song is in." and "The chords stay as they are.", and name the key guessed from the chords now, also once a key is set; mark the guessed key in the grid when it isn't the sheet's key. Verify with `key-button.test.tsx` and `sheet-title.test.tsx`
- [x] 5.3 Update `docs/ui-text.md` and the e2e tests for the new names, and add one for the guess after setting; verify `just check` passes. A photo-import test failed once with an HTML error page from the API, then passed 4 times on its own and in a second full `just e2e` run
- [x] 5.4 Check the panel and the Change view in the browser at desktop width and on a phone; verify they read as two different things

## Workflow follow-up

- Open an issue for a key per section, split off from #58, in M6 or later.
- Open the pull request that closes #58.
- Archive the change once it is merged.
