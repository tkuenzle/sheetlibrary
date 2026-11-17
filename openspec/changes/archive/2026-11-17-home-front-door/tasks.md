# Tasks

## 1. Key without the address

- [x] 1.1 Give `useSheetKey` in `editor/sheet-title.tsx` an option that keeps `key` and `capo` out of the address, and verify with a test in `sheet-title.test.tsx` that the address values it writes are empty with it (the unit tests render on the server only; the e2e test in 3.3 checks the address itself)
- [x] 1.2 Check that the play view and `/editor` still write `key` and `capo` by running their existing unit and e2e tests

## 2. Sample card

- [x] 2.1 Rework `home/sample-sheet.tsx` into the card from the board: title, "John Newton", `KeyButton` (`viewOnly`) and `CapoButton` driving a transposed `SheetView`, named "Sample sheet", without `aria-hidden` and without the tilt; verify with `sample-sheet.test.tsx` that it renders "Key G", "Capo", "Verse 1" and the four lines
- [x] 2.2 Style the card in `sample-sheet.css` after the play view's heading and chips, and check it at 1280px and 390px with the browser-check skill

## 3. Home page

- [x] 3.1 Rewrite `routes/home.tsx`: the heading, the line, "Sign in" to `/sign-in`, "Try it first" to `/editor`, the card with "A sample sheet. Try changing the key." below it, and the three things with their icons; verify with `home.test.tsx` (text, links, no "Coming soon", no "you can")
- [x] 3.2 Lay out `home.css` with grid areas: two columns from 1024px, one column below that in HTML order (intro, card, list); check both widths with the browser-check skill
- [x] 3.3 Update `e2e/home.spec.ts`: the new heading, both ways in, picking A on the sample moves the chords and keeps the address `/`, a reload shows G, screen readers read "Sample sheet", and on a 390px window the card comes before the list; verify the suite passes
- [x] 3.4 Add a "Home page" entry to `docs/ui-text.md` with the page's words, and verify they match `home.tsx`

## 4. Checks

- [x] 4.1 Run the unit tests, the e2e tests (including `e2e/design-system.spec.ts`, which opens `/`), lint and typecheck, and verify all pass (all pass; "shows the bar while a page is slow to load" in `e2e/waiting.spec.ts` fails about one run in three, in code this change doesn't touch)

## Workflow follow-up

- Open an issue for what becomes of `/editor`: move the key and capo requirements out of `editor-page`, then choose between the home card as the only trial and a sample sheet on the sheet page.
- Update the Purpose in `openspec/specs/home-page/spec.md` when archiving: it still says the app is not ready yet.
- Update the green "Front door" note on the canvas, which still says `/editor` goes away.
