# Tasks

## 1. Lyrics only in the sheet view

- [x] 1.1 Add `lyricsOnly` to `SheetView`: labels and plain lines, no chords, without lines of chords only and sections left empty, styled in `sheet-view.css`. Verify with `sheet-view.test.tsx` cases for an Intro of chords only, a line of chords only inside a verse, and no chord names in the HTML.

## 2. Building blocks

- [x] 2.1 Add the "lyrics" and "check" icons to `ui/icons/` and `ui/icons.ts`. Verify `icon.test.tsx` and `pnpm typecheck` pass.
- [x] 2.2 Give `MenuItem` an optional `checked`: a `menuitemcheckbox` with `aria-checked` and a check after the name when on. Verify with `menu.test.tsx` cases for checked and unchecked items.
- [x] 2.3 Export `useAddressParam` and let it write a flag as `lyrics` without `=`. Verify with a `sheet-title.test.tsx` case that the address reads `?key=A&lyrics`, and that turning it off takes `lyrics` out.

## 3. Lyrics only on the play view

- [x] 3.1 Read `?lyrics` in the loader and pass it to `PlayView`, which keeps it in state and renders `SheetView` with `lyricsOnly` and without the key and capo buttons. Verify with `sheet.test.tsx` cases that `?lyrics&key=A` renders no chords and no key button in the server HTML.
- [x] 3.2 Add the wide-screen toggle before the text size, with the divider, and its off and on looks from the canvas. Verify with a `sheet.test.tsx` case for `aria-pressed`, and that "Edit" keeps `key` but not `lyrics`.
- [x] 3.3 Add "Lyrics only" as the first, checkable item of the phone's menu, and the phone's label, hidden on wide screens and in print. Verify with a `sheet.test.tsx` case for the menu item.
- [x] 3.4 Add e2e tests to `e2e/play.spec.ts`: the toggle hides and shows the chords with no page load, the address follows and keeps the key, a reload keeps lyrics only, print mode shows no chords, and on a phone the menu item and label work. Verify they pass.
- [x] 3.5 Add the toggle, the menu item and the phone's label to the play view entry in `docs/ui-text.md`. Verify the words match the page.

## 4. In a browser

- [x] 4.1 With the `browser-check` skill, turn lyrics only on and off at desktop and phone width, in light and lamplight, and print to PDF. Verify against the design canvas, and that nothing moves after load.
- [x] 4.2 Run `pnpm test`, `pnpm typecheck`, the linter and the e2e suite. Verify all pass.

## Workflow follow-up

- Open issues for the proposal's open questions the user wants to keep, after asking the user.
