# Tasks

## 1. Editor page

- [x] 1.1 Add the ProseMirror packages to `apps/web` and verify `just typecheck` passes
- [x] 1.2 Add the `/spike/editor` route, which starts the editor on the client with the "Amazing Grace" seed song as plain lyrics; verify it loads on the preview link and the home e2e test still passes
- [x] 1.3 Link the spike from the home page as a prototype; verify with the home unit and e2e tests

## 2. Chords and display

- [x] 2.1 Add the chord atom node and a node view that shows chords above their letters; verify the seed song shows its chords on the preview link
- [x] 2.2 Push lyrics apart where chord labels would overlap, including several chords on one letter; verify "Cmaj7" and a three-chord pile on the preview link on desktop and a phone
- [x] 2.3 Verify chords stay above their letters when long lines wrap on a phone

## 3. Rules for chords and text

- [x] 3.1 Add the rescue plugin for deleted and replaced letters, keeping piles in order; verify with Vitest tests for the "Chords are rescued" and "Several chords on one letter" scenarios
- [x] 3.2 Let chords go with fully deleted lines only; verify with Vitest tests for both "Deleting whole lines" scenarios
- [x] 3.3 Verify chords stay on their letters when typing before them and when splitting and joining lines, with Vitest tests
- [x] 3.4 Make undo and redo cover the edit and its rescue in one step; verify with a Vitest test for "Undo a deletion"

## 4. Caret and keys

- [x] 4.1 Add the caret plugin, so a chord adds no caret stop and typed text goes before the chord; verify with a Vitest test and arrow keys on desktop
- [x] 4.2 Make forward Delete remove the next letter, not the chord; verify with a Vitest test

## 5. Placing chords

- [x] 5.1 Add chord mode, in which a click or tap on a letter opens a chord input; verify on desktop and Android that no keyboard opens for the lyrics (iPhone not tested)
- [x] 5.2 Add a keyboard shortcut that opens the chord input at the caret in text mode; verify on desktop
- [x] 5.3 In chord mode, let the user select a chord to change its text, delete it, or move it by tapping another letter; verify on desktop and a phone

## 6. Chords as marks

- [x] 6.1 Store chords as a mark on their letter, one mark per letter holding a list of chords, with ChordPro in and out; verify with Vitest tests for parsing and piles
- [x] 6.2 Rebuild the rescue for marks, including whole-line deletion and undo in one step; verify the rule tests from group 3 pass against marks
- [x] 6.3 Put a chord after the last letter of a line on a trailing space; verify with a Vitest test
- [x] 6.4 Try a typo rule (a chord moved by a deletion goes to the next letter typed at the same spot), then remove it; verify the retype tests expect the chord on the next letter
- [x] 6.5 Remove the caret plugin and key handling; verify the arrow key, Delete and typing e2e tests pass with the browser's own caret
- [x] 6.6 Draw chords in a layer outside the editable text, with space added in front of letters where labels would overlap; verify the display e2e tests (above letters, no overlaps, wrapping)
- [x] 6.7 Move chord mode and Ctrl/Cmd+K to the new layer; verify the chord mode and shortcut e2e tests
- [x] 6.8 Drag a chord by mouse or touch, with a caret showing where it lands; verify with an e2e test on desktop and phone emulation

## 7. Device check and verdict

- [x] 7.1 Rerun the checks that failed on Android for marks and record the results in `docs/editor-spike.md`, next to the atom results (other targets not tested)
- [x] 7.2 Decide on the typo rule and record it in `docs/editor-spike.md`: dropped, see design.md
- [x] 7.3 Write the verdict in `docs/editor-spike.md`: chosen approach, known device issues, answers to the open questions; mark M1 done and update the open questions in `docs/roadmap.md`
