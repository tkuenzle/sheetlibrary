# Tasks

## 1. Storage

- [x] 1.1 Add `listSheets(db, userId)` to `sheets.server.ts`: id, title, artist and `updatedAt` of the person's sheets, newest first, without `content`. Verify with unit tests on `testEnv()` for the scenarios "Newest edit first" and "Someone else's sheets"

## 2. Library page

- [x] 2.1 Add the `/sheets` route with a loader that sends visitors to `/sign-in` and returns the list, `noindex` and the tab title "Library | Sheet Library". Verify with loader tests for "Not signed in" and the list
- [x] 2.2 Add the action behind "New sheet": create an "Untitled" sheet with empty content and redirect to `/sheets/:id`; without a session, redirect to `/sign-in`. Check that the session cookie is `SameSite=Lax`. Verify with action tests for both cases
- [x] 2.3 Build the page from the canvas boards in design.md: heading, "New sheet" (beside the heading when wide, the large button at the bottom right on a phone), grouped rows, and the "No sheets yet" state. Verify with render tests for the list and the scenario "First sign-in", and by looking at it on a phone and a wide window with the browser-check skill
- [x] 2.4 Format the last edit as "Today", "Yesterday", "28 Oct" or "3 Sep 2025" in the viewer's time zone after hydration. Verify with unit tests on fixed dates, including the scenario "Edited earlier this year"
- [x] 2.5 Add the library's words to `docs/ui-text.md`: "Library", "New sheet", "No sheets yet", "Untitled", the column labels and the last-edit format

## 3. Shell

- [x] 3.1 Give `/` a loader that redirects signed-in people to `/sheets`. Verify with a loader test for the scenario "Signed in" and that `home.spec.ts` still passes for visitors
- [x] 3.2 Link "Sheet Library" in the top bar to `/sheets` when signed in. Verify with `top-bar.test.tsx` for both cases (scenarios "Going home from the editor" and "Back to the library")
- [x] 3.3 Land sign-in in the library: the email link's `callbackURL` is `/sheets`, the sign-in loader redirects signed-in people to `/sheets`, and the `?welcome` offer leaves the account page with its tests. Verify with the sign-in loader test and an e2e check that opening the email link lands in the library (scenario "Opening the email link")

## 4. Checks

- [x] 4.1 Add an e2e test: sign in with no sheets, see "No sheets yet", select "New sheet", land on a sheet titled "Untitled", go back with "Sheet Library" and see it listed (scenario "Starting a sheet")
- [x] 4.2 On this pull request's preview, sign in, create two sheets, edit the first and check that it moves to the top
- [x] 4.3 Run `just check` and `just spec-check`. Verify both pass

## Workflow follow-up

- Close #51 with the pull request. Archive the change after review.
