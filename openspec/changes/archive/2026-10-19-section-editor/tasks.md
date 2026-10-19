# Tasks

## 1. Package

- [x] 1.1 Create `packages/chord-editor` with its `package.json` (depending on `chordsheet` and the ProseMirror packages), a `tsconfig.json` with the DOM lib and its `@types` packages in `types`, Vitest, and `test` and `typecheck` scripts; verify `just typecheck`, `just lint` and `just test` pick it up

## 2. Editor core

- [x] 2.1 Port the schema, the chord commands (add, edit, delete; no move) and the rescue plugin from the spike; verify by porting `rescue.test.ts` to the package and running it with Vitest
- [x] 2.2 Port the chord layer without dragging: a click on a label calls back with its chord, and Ctrl+K or Cmd+K calls back with the caret; verify `just typecheck` (the layer is covered by the Playwright tests in 4.3)
- [x] 2.3 Add the editor's stylesheet, with colors, fonts and spacing as CSS custom properties with defaults; verify the package exports it

## 3. Adapter

- [x] 3.1 Load a model section into an editor state: lines, chords as marks, a trailing space for chords after the last letter, new ids; verify with Vitest tests, including a pile and a chord after the last letter
- [x] 3.2 Hand a section back: read lines and chords, turn a trailing space with chords into chords at the text's length, normalize to NFC run by run, clean up and check; verify with Vitest tests for the scenarios of "Editing one section" and "Handing back a section", and a check that fails

## 4. Test page

- [x] 4.1 Add the seed song ("Amazing Grace", two sections) as model JSON in `apps/web`; verify it passes `checkSheet` in a Vitest test
- [x] 4.2 Add the React wrapper, the chord input (add, edit, Delete, Escape) and the `/section-editor` route (noindex) with **Done**, the JSON view and **Edit**; verify by hand with `just dev`
- [x] 4.3 Add Playwright tests for `/section-editor` on desktop and phone: chords above their letters, wide chords, wrapped lines, add by keyboard, edit and delete by clicking a label, and a Done and Edit round trip; verify `just e2e` passes

## 5. Docs and specs

- [x] 5.1 Update `docs/roadmap.md`: drop the iPhone check step and note the accepted risk, renumber M2 (b section editor, c sheet editing, d chord interactions, e publish, f UI polish with tokens, type, base components, glossary and voice), and move both rough edges to M2d; verify the roadmap matches proposal.md
- [x] 5.2 Update the Purpose of `openspec/specs/chord-editor/spec.md`, which still says chords are placed by tap; verify `just spec-check` passes
- [x] 5.3 Run `just check`; verify it passes
