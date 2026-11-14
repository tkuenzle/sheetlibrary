# Tasks

## 1. The rail and the bottom bar

- [x] 1.1 Add the icons `library_music` and `stacks` to `ui/icons/` and `icons.ts`, from Google's static icons as `icons.ts` describes. Verify `icon.test.tsx` passes.
- [x] 1.2 Add `ui/nav-rail.tsx`: the site's name, the items with icon and name, the sub-items with a count under an item, a slot at the bottom, the current item marked with `aria-current`, a list that scrolls on its own, and a compact form with icons, names for screen readers and tooltips. Verify with unit tests for the marked item, the sub-items and the compact form's names.
- [x] 1.3 Add `ui/nav-bar.tsx`: the items with icon and name, the current one marked. Verify with a unit test.
- [x] 1.4 Show the rail, its compact form and the bar on `/design` in both styles, and keep their outline in forced colors. Verify `e2e/design-page.spec.ts` passes with a case for them.
- [x] 1.5 Add the two components to "Components" in `docs/design-direction.md`. Verify the text matches the files.

## 2. The shell

- [x] 2.1 Add `routes/shell.tsx` as a layout route around `/sheets`, `/collections`, `/collections/:id` and `/account` in `routes.ts`. Its loader redirects a visitor to `/sign-in` and returns the collections, and skips reloading when only the search changes. Verify with loader tests for both, and `react-router typegen` passes.
- [x] 2.2 Render the shell: the skip link, the rail, its compact form and the bar with "Sheets", "Collections", the collections and the account, and `<main>` with the outlet. Lay it out as a grid with fixed tracks at the three widths, with the rail sticky and the bar fixed. Verify with unit tests for what is marked on `/sheets`, `/collections`, a collection and `/account`.
- [x] 2.3 Take `TopBar`, `LibraryTabs` and `<main>` out of the four routes. Head the screens "Sheets" and "Collections", with their buttons as today, and set the tab title "Sheets | Sheet Library". Let `/collections` read the shell's list. Delete `sheets/library-tabs.*`. Verify `sheets.test.tsx`, `collections.test.tsx`, `collection.test.tsx` and `account.test.tsx` pass, updated.
- [x] 2.4 Show a collection that isn't found inside the shell, without a top bar. Remove `accountPage` and the link form of `back` from `TopBar`. Verify `top-bar.test.tsx` and `collection.test.tsx` pass.
- [x] 2.5 Put the docked buttons above the bottom bar on phones, and pad the content so the last row clears both. Verify in `e2e` on a phone that "New sheet" and the last row can both be clicked.
- [x] 2.6 Update `e2e/library.spec.ts`, `collections.spec.ts` and `account.spec.ts` for the shell: the headings, the navigation named "Main", no top bar, the rail listing a new collection and dropping a deleted one, on a wide screen and a phone. Verify they pass.
- [x] 2.7 Update `docs/ui-text.md`: the entries for the top bar, the library, the tabs, Collections, a collection and the search, and new ones for the navigation and "Skip to content". Update "The signed-in shell" and "Widths" in `docs/design-direction.md` with what was decided. Verify the words match the pages.

## 3. Search on Sheets

- [x] 3.1 Keep `SearchField` on the Sheets screen, below its heading, and off the other screens. Verify with the search cases in `sheets.test.tsx` and a `shell.test.tsx` case that the shell has no field.
- [x] 3.2 Verify in `e2e` that Collections and the account page have no search field, and that the existing search cases pass.

## 4. Links and focus

- [x] 4.1 Use `<Link>` for the rows on Sheets, Collections and a collection, and for "Add passkey". Keep `<a href>` in `TopBar`. Verify in `e2e` that opening a row loads no new document, and that leaving the editor with unsaved edits still asks.
- [x] 4.2 Add the focus hook to `root.tsx`: on a new path, focus the `h1` in `<main>` without scrolling, unless focus is already in `<main>` or the navigation says to keep it. Verify with unit tests for each case.
- [x] 4.3 Make the skip link move focus to `<main>`. Verify in `e2e`: Tab then Enter on `/sheets` puts focus on the content.
- [x] 4.4 Add `e2e` cases: opening Collections focuses its heading, a row focuses the sheet's title, "New sheet" keeps the title field, and Back returns the list to where it was scrolled. Verify they pass.

## 5. Checks across the app

- [x] 5.1 With the `browser-check` skill, go through Sheets, Collections, a collection, the account page and a search from each, at wide, middle and phone width, in light and dark. Verify against the canvas page "UX overhaul", and that nothing moves between screens.
- [x] 5.2 Run `just check` and `just spec-check`. Verify both pass.

## Workflow follow-up

- Ask the user which of the proposal's open questions to keep, and open an issue for a search that finds collections if they want one.
- At archive, update the Purpose of `site-layout` to name the shell, and of `library-search` to say the field is at the top of the shell's screens.
- #129 follows directly, since moves no longer show the browser's loading sign.
