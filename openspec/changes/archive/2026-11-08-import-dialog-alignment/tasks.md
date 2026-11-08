# Tasks

## 1. The fix

- [x] 1.1 In `apps/web/app/routes/sheets.css`, move `text-align: center` from `.library-empty` to its own heading, and narrow `.library-empty h2` to `.library-empty > h2` so the dialog titles don't match it; verify `just check` passes

## 2. Checks

- [x] 2.1 In the browser, open "From photos…" and "From Ultimate Guitar…" on an empty library and on one with sheets, at desktop and 360px width; verify the dialogs look the same in both, with their text aligned to the start
- [x] 2.2 On the empty library at 360px width, verify "No sheets yet", "Import" and "New sheet" are still centred

## Workflow follow-up

- Open the pull request that closes #112.
- Archive the change once it is merged.
