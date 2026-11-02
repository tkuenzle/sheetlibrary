# Tasks

## 1. Storage

- [x] 1.1 Add `apps/web/migrations/0003_sheets.sql` with the `sheet` table and its `(userId, updatedAt)` index. Verify `just migrate-local` applies it
- [x] 1.2 Add a server module for sheets: create, read, save with the conditional update, and delete, always scoped to a user id. Verify with unit tests on `testEnv()` for the scenarios "Create and read back", "Save on the current revision", "Two tabs" and "Someone else's sheet"

## 2. API

- [x] 2.1 Add the resource routes `/api/sheets` (`POST`) and `/api/sheets/:id` (`GET`, `PUT`, `DELETE`): 401 without a session, 404 for an unknown or someone else's id, 409 for a stale save, 400 for a body over 256 KB or one that fails `checkEnvelope`. Verify with tests for each answer, including the scenarios "Not signed in" and "Invalid sheet"

## 3. Editor

- [x] 3.1 Add `onChange` (after every document change) and `readOnly` (no editing, no chord input, no section toolbar) to `SheetEditor`. Verify with editor tests, and that `/editor`'s tests and e2e still pass

## 4. Sheet page

- [x] 4.1 Add `/sheets/:id`: a loader that sends visitors who aren't signed in to `/sign-in` and answers 404 for other ids, and a page with the editor, title, key button and help, and `noindex`. Verify with tests for the scenarios "Opening a sheet", "Not signed in" and "Someone else's sheet"
- [x] 4.2 Add the save loop from the design: a 1 s quiet time, one save in flight, retries with backoff, and a stop on 409 with the editor read-only. Verify with tests on a fake `fetch` for the scenarios "Offline" and "Two tabs" (sheet-page)
- [x] 4.3 Show the save state and the conflict notice, and turn the leave prompt on whenever the state isn't saved. Add the words to `docs/ui-text.md`. Verify with tests for the scenario "Leaving after the save" and the shown states
- [x] 4.4 Let e2e tests sign in, by reading the email link that local wrangler writes for `send_email`. Add an e2e test that creates a sheet through the API, edits it on `/sheets/:id`, reloads and sees the edit (scenario "Reload after editing")

## 5. Checks

- [x] 5.1 On this pull request's preview, sign in, create a sheet through the API, edit it in two tabs and check the conflict notice in the second
- [x] 5.2 Run `just check` and `just spec-check`. Verify both pass

## Workflow follow-up

- Close #50 with the pull request. Archive the change after review.
