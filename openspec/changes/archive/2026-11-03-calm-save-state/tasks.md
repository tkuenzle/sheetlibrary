# Tasks

## 1. The longest wait

- [x] 1.1 Add `maxWaitMs` (default 5000) to `Autosave`: keep the time of the first edit not yet sent, and schedule each save at the earlier of the quiet wait and 5s after that edit, including edits made during a save. Verify with `autosave.test.ts` using fake timers: one save at 5s while edits keep coming every 500ms, the 1s pause still saves sooner, and edits during a save go out within 5s of the first of them

## 2. What the status shows

- [x] 2.1 Add a hook beside `SaveStatus` that turns the real state into the shown one, as in the design's table: nothing while waiting, "Saving…" after 500ms, "Saved" after 1s but at once on load, failures at once, and any state change cancels a pending delay. Verify with unit tests on fake timers, including no "Saved" between two saves while typing
- [x] 2.2 Have the sheet page show the hook's result in `SaveStatus`, keep the leave warning on the real state, and give `.save-status` a minimum height of one line. Update `sheet.test.tsx` for the new texts
- [x] 2.3 Update the "Saving a sheet" line in `docs/ui-text.md`: nothing while edits wait, "Saving…" only for a slow save

## 3. Checks

- [x] 3.1 Update `e2e/sheet.spec.ts`: the save test sees an empty status while typing and then "Saved" (scenario "Typing"), and a new test delays the save route to see "Saving…" (scenario "Slow save")
- [x] 3.2 Type on a sheet in a phone-width and a wide window with the browser-check skill, and verify the status stays blank while typing, the title row doesn't move, and "Saved" appears after stopping
- [x] 3.3 Run `just check` and `just spec-check`. Verify both pass

## Workflow follow-up

- Close #86 with the pull request. Archive the change after review.
