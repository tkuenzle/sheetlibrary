# Tasks

## 1. Trimming spaces in the model

- [x] 1.1 `cleanUpSection` in `packages/chordsheet` trims spaces at both ends of each line, stopping at a space that holds a chord, and moves chord positions. Verify with Vitest tests in `clean-up.test.ts` for the spec's scenarios, plus a line of only spaces being dropped.
- [x] 1.2 The clean-up also collapses runs of spaces inside a line: one space for a run without chords, only the chorded spaces for a run with chords. One shared function finds the spaces to drop. Verify with Vitest tests for the spec's scenarios.

## 2. Trimming spaces in the editor

- [x] 2.1 The editor's section clean-up in `active-section.ts` deletes the same space ranges from the editor document. Verify with Vitest tests in `active-section.test.ts`: leading and trailing spaces go, a space with a chord stays, and a chord dragged off the end of a line leaves no trailing space once the caret leaves the section.
- [x] 2.2 Verify that handing back a sheet after these edits gives the trimmed lines, with a test in `adapter.test.ts`.
- [x] 2.3 The editor's section clean-up uses the shared function to collapse spaces too. Verify with a Vitest test in `active-section.test.ts` that a typed double space becomes one when the caret leaves the section, and that a space with a chord is kept.

## 3. Layout of piles and chords on spaces

- [x] 3.1 `render()` gives a pile, or a chord on a space, a right margin worked out from the label and letter widths, so the next letter starts past the last label. Single chords keep today's `margin-left` push. Verify with a Playwright test in `sheet-editor.spec.ts`: after a pile on the "t" of "the", the "h" starts after the last label; after a chord on a space, the next word does too.
- [x] 3.2 `render()` writes a margin only when it differs from the current one, instead of clearing all margins first. Verify that the existing layout tests still pass, including the wrapped-line test.
- [x] 3.3 Update the "spreads lyrics for wide chords and piles" test to the new layout, and verify that it passes.
- [x] 3.4 Verify with a Playwright test that a label dragged onto a letter right after a pile lands on that letter.

## 4. Dashes

- [x] 4.1 The chord layer draws a dash in the gap after a pile when the pile's letter and the next letter aren't spaces and are on the same row. The dash is styled through a custom property in `style.css`. Verify with a Playwright test: a dash shows inside "the", none shows after a chord on a space, and the line's text is unchanged.
- [x] 4.2 A gap with a dash is at least 0.6em wide. Verify with a Playwright test: after "I" and "V" on the "m" of "my", the gap is at least 0.6em.
- [x] 4.3 Dashes and the minimum also apply where long labels push a letter of a word away from the one before. Verify with a Playwright test: "Cmaj7" on the "t" of "the" and "Dsus4" on the "h" give one dash between them.

## 5. Placing labels without delay

- [x] 5.1 `update()` and the ResizeObserver callback call `render()` directly, without `requestAnimationFrame`. Verify with a Playwright test that, after a chord is added on a space, the label and the pushed word are in place without waiting for a frame.
- [x] 5.2 Verify with a Playwright test that edits on a long song with piles and chords on spaces lay out the page at most twice per edit, counted by Chrome. If they don't, apply design.md's fallback.

## 6. Clicking in a gap

- [x] 6.1 After each update, the chord layer draws a caret right after a letter with a gap at the end of the gap. Verify with a Playwright test, on desktop and phone emulation, that a click near either side of a gap shows the caret before the "h" and that typed text appears there.
- [x] 6.2 Verify with a Playwright test that a click in a gap in front of a pushed letter shows the caret after the letter before it, where typed text appears.

## 7. Wrap-up

- [x] 7.1 Mark chord-drag and chord-layout as done in `docs/roadmap.md`.
- [x] 7.2 Run the typecheck, lint, and all Vitest and Playwright tests, and verify that they pass.
- [x] 7.3 Use the browser-check skill on `/sheet-editor` to check piles, chords on spaces, dashes and gap clicks by hand on desktop and phone sizes.
- [x] 7.4 Run all checks again after 1.2, 2.3 and 4.2, and verify that they pass.

## Workflow follow-up

- Check caret and gap clicks on an iPhone using the preview link.
- Archive the change after the pull request is merged.
