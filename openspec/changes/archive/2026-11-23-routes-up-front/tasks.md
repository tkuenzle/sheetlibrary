# Tasks

## 1. Routes up front

- [x] 1.1 Set `routeDiscovery: { mode: "initial" }` in `apps/web/react-router.config.ts`; verify `just build` passes and the first page of `/sheets` carries all 21 routes
- [x] 1.2 Add an e2e test for "A sheet opened for the first time": open a sheet from `/sheets` right after the page loads, and verify no `/__manifest` request is made, only the sheet's data
- [x] 1.3 Remove the note and the filter for `/__manifest` requests in `e2e/play.spec.ts`; verify the test still passes
- [x] 1.4 Check what a tab loaded before the change does when it asks `/__manifest` after it: with a page from a lazy build open, swap in the new build and open a sheet; record the result in design.md

## 2. Check

- [x] 2.1 Run `just check` (format, lint, typecheck, unit tests, build, e2e); verify all pass
- [x] 2.2 Measure first opens of sheets in one session with 50–100ms latency, as before the change; verify none asks `/__manifest`, and that a sheet whose route code is loaded rises on its first open (the session's first sheet still waits for the route's code, #141)

## Workflow follow-up

- Open the PR, closing #176.
- Archive the change after review.
