# Tasks

## 1. Width table

- [x] 1.1 Add `fontkit` and `wawoff2` as dev dependencies of `apps/web`. Verify `pnpm install` succeeds.
- [x] 1.2 Write `apps/web/scripts/font-widths.ts`. It unpacks the Latin and Latin Extended woff2 files of `@fontsource-variable/schibsted-grotesk` to TTF, reads each character's width at weight 400 and 700, and writes `apps/web/app/sheet-view/font-widths.json`. Add a `font-widths` script to `apps/web/package.json`. Verify it writes the table and that "M" is wider at 700 than at 400.
- [x] 1.3 Add `widthOf(text, weight)` in `apps/web/app/sheet-view/`, which counts a character missing from the table as 1em. Verify with unit tests for a known word and a missing character.

## 2. Layout

- [x] 2.1 Add `layoutSheet(sheet, widths)` in `apps/web/app/sheet-view/layout.ts`. It returns sections with their labels, and lines as units and pieces, ending pieces as design.md says. Verify with unit tests for a single chord with room, "[Am7]I [G]love", a long stretch cut at a space, a pile, a chord on a space, a chord at the end of a line and a line of chords only.
- [x] 2.2 Add the dash and its minimum to the pieces: a dash where the names are wider than the text minus 0.15em inside a word, with a minimum width of the text plus 0.6em. Verify with unit tests for "Hal[F]le[Am]lu[F]jah" and for a chord inside a word with room.

## 3. View

- [x] 3.1 Add the `SheetView` component and `sheet-view.css`: units that don't break, pieces as columns with a fixed chord row, chord names at 0.75em and weight 700 with 0.3em after them, the dash as a border with its guard, no lyrics row on a line of chords only, and `break-inside: avoid` on lines. Verify with a `sheet-view.test.tsx` that renders the seed song to a string, with its label, chords and lyrics, and no script.
- [x] 3.2 Add a page to `apps/web/harness/` that shows the view with the spike's test lines. Add `e2e/sheet-view.spec.ts`, run at 320, 480 and 800px, checking no overlapping names, no space after a piece unless the next piece has chords, spaces inside words of at least 0.6em, no sideways scroll, and the table within 0.1em of the browser's widths. Verify the test passes.
- [x] 3.3 Add a test to `e2e/sheet-view.spec.ts` that checks, in print mode, that lines keep `break-inside: avoid`, labels `break-after: avoid`, and dashes are borders, not backgrounds, and that the page prints to an A4 PDF. Verify the test passes.

## 4. Home card

- [x] 4.1 Make `SampleSheet` show the view of the seed song's first section inside its card, without the badge and the static pieces, keeping the title, the tilt and `aria-hidden`. Update `sample-sheet.test.tsx` and `sample-sheet.css`. Verify the unit test and `e2e/home.spec.ts` pass, with a check for "Verse 1".
- [x] 4.2 Check the home page and the harness page in a real browser at desktop and phone width with the `browser-check` skill, and print the harness page from the browser. Verify the card doesn't move after load and the print matches the spike.

## 5. Issues

- [x] 5.1 Update issue #23's text to the flow view, and open an issue for scripts other than Latin, after asking the user. Verify both on GitHub.
