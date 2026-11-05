# Tasks

## 1. Reading the answer

- [x] 1.1 Add `src/photo-answer.ts` with the line step: blank lines, directive lines and lyrics lines with inline chords read through `readMarkedChord`; verify with tests for `A[D]mazing [G]grace`, `grace[D7] how`, `[D] [A] [Bm] [G] x2`, `[(C)]Oh [[F]]yes`, `[N.C.]Hey [G]you` and an unclosed `[`
- [x] 1.2 Group lines into sections from `{start_of_…}` and `{end_of_…}`, with labels cut to fit, lines outside a section in a section without a label, blank lines ignored, other directives dropped, and each section cleaned up; verify with tests for each scenario in the `photo-answer-format` spec
- [x] 1.3 Read `{title}` and `{artist}`, cleaned up as labels are, and return `{ title?, artist?, content }`; verify with tests for an answer with both and one with neither
- [x] 1.4 Export `readPhotoAnswer` and add a test that a full answer and odd text, such as only blank lines or only directives, give sheets that pass `checkSheet`; verify with `just test`

## 2. The prompt

- [x] 2.1 Add `src/photo-answer-prompt.ts` with the version 4 prompt from `docs/photo-import-spike.md`, edited to drop comments, composer and lyricist, add `[[C]]` for optional chords, write plain repeats out with `x2` allowed on lines of chords only, and write spoken words as plain lines; export it and verify with `just typecheck`
- [x] 2.2 Add a test that reads each inline example in the prompt and checks the chords the prompt describes; verify with `just test`
- [x] 2.3 Point `docs/photo-import-spike.md` to the prompt's new home and say the edits are not run yet; verify with `just fmt-check`

## Workflow follow-up

- #93 or #102 runs the edited prompt on the spike songs.
- Archive the change after review.
