# Tasks

## 1. Package

- [x] 1.1 Create `packages/chordsheet` with its `package.json`, a `tsconfig.json` that lists its `@types` packages in `types`, Vitest, and `test` and `typecheck` scripts; verify `just typecheck`, `just lint` and `just test` pick it up

## 2. Model and rules

- [x] 2.1 Add the version 1 content types (sections, lines, chords), documenting that positions count UTF-16 code units; verify `just typecheck`
- [x] 2.2 Add the check, which reports every problem with its section, line and chord; verify with Vitest tests for the scenarios of "Versions", "Chord positions", "Chord order", "No empty lines" and "Checking a sheet"
- [x] 2.3 Add the clean-up step for one section; verify with Vitest tests for "Cleaning up a section"
- [x] 2.4 Verify "Sheet content", "Chords are text" and "Chord order" with Vitest tests that build sheets by hand, including a pile and a chord after the last letter

## 3. Docs

- [x] 3.1 Update `docs/roadmap.md`: mark M2a's decisions (content only, sections, chords as text), move ChordPro import and export to its own step, add the idea of editing one section at a time, and update the open questions on sections and metadata; verify the roadmap matches design.md
