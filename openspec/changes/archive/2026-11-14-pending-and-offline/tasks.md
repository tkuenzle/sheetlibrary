# Tasks

## 1. Base pieces

- [x] 1.1 Add the icons `cloud_off` and `refresh` to `ui/icons/` and `icons.ts`, as `icons.ts` describes. Verify `icon.test.tsx` passes.
- [x] 1.2 Move the 200ms delay out of `useSearchPending` into a shared hook, and use it there. Verify the search's "Searching…" cases in `sheets.test.tsx` still pass, and a unit test for the hook covers a wait shorter and longer than 200ms.
- [x] 1.3 Add the error view to `ui/`: icon, `h1`, line and "Try again", in a "can't reach" and a "something went wrong" form, chosen from the error as the design says. Verify with unit tests for a failed fetch, `navigator.onLine` false, and a 500.
- [x] 1.4 Add the bar, standing still, and both forms of the error view to `/design`, in both styles, with an outline in forced colors. Verify `e2e/design-page.spec.ts` passes with a case for them.

## 2. The loading bar

- [x] 2.1 Render the bar in `root.tsx`: fixed at the top of the window, shown after 200ms while the navigation isn't idle, not for a search on `/sheets`, sliding only without reduced motion. Verify with unit tests for a slow move, a fast move, a form submission and a search.
- [x] 2.2 Add `e2e` cases with a slowed response: the bar shows on a slow move between Sheets and Collections, and not during a slow search. Verify they pass.

## 3. Errors inside the frame

- [x] 3.1 Add an `ErrorBoundary` with the error view to `sheets.tsx`, `collections.tsx`, `collection.tsx` and `account.tsx`. "Try again" navigates to the same address with `replace`. Verify with unit tests that the view shows and "Try again" loads the address again.
- [x] 3.2 Add the shell's `ErrorBoundary`: `ShellView` with no collections and the error view. Verify with a unit test that "Sheets", "Collections" and the account are there.
- [x] 3.3 Add an `ErrorBoundary` with the top bar and the error view to `sheet.tsx` and `sheet.edit.tsx`. Verify with unit tests.
- [x] 3.4 Add the root's `ErrorBoundary`: the site's name and the error view, with "Try again" reloading the page. Verify with a unit test.
- [x] 3.5 Show "Page not found" from the root's boundary for an address that matches no page: 404 status, not indexed, and "Go to your sheets" or "Go to the home page" depending on sign-in. Verify with unit tests for both links, and an `e2e` case that opens `/shets`, checks the status and follows the link.
- [x] 3.6 Give the root and the shell one `shouldRevalidate` rule that keeps their data on plain moves, and call `revalidate()` after making and deleting a collection. Verify with unit tests for the rule, and that the e2e cases for a new and a deleted collection in the rail still pass.
- [x] 3.7 Add an `e2e` case: go offline, select a collection in the rail, see the rail and "Can’t reach Sheet Library", go online, select "Try again", see the collection. Verify it passes on a wide screen and a phone.

## 4. A search that doesn't go through

- [x] 4.1 Add a `clientLoader` to `sheets.tsx` that returns `{ failed: true }` when the server can't be reached. In `LibraryView`, keep the last list shown and show "Couldn’t search. Showing the last results." below the field; with no list to keep, throw to the screen's boundary. Verify with unit tests for each case.
- [x] 4.2 Add an `e2e` case: search "o du", go offline, type on, see the old results and the note, go online, type, see new results and no note. Verify it passes.

## 5. Docs and checks

- [x] 5.1 Add the bar, the error view, "Page not found" and the failed search's note to `docs/ui-text.md`. Add the bar and the errors to `docs/design-direction.md`, and the bar and the error view to its "Components". Verify the words match the pages and the canvas row "Waiting and offline".
- [x] 5.2 With the `browser-check` skill, throttle and go offline on Sheets, Collections, a collection, the account page and a sheet, at wide and phone width, in light and dark. Verify the bar and the errors match the canvas, and the editor's save state is unchanged.
- [ ] 5.3 Run `just check` and `just spec-check`. Verify both pass.
