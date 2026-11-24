# Tasks

## 1. A fresh database per run

- [x] 1.1 In `vite.config.ts`, use `persistState: { path }` when `E2E_STATE_DIR` is set. Verify `just dev` still uses `.wrangler/state`.
- [x] 1.2 Change the app server's `webServer` command to empty `.wrangler/e2e-state`, migrate it and start the preview with `E2E_STATE_DIR`. Set it never to be reused. Verify that two runs in a row leave no sheets from the first, and that the dev database is unchanged.
- [x] 1.3 Check where local wrangler writes sign-in emails with the new state folder, and point `emails.ts` there if needed. Verify that a sign-in finds its link.

## 2. Accounts per worker slot

- [x] 2.1 Add `e2e/fixtures.ts` with the worker-scoped account (session file per `parallelIndex`, checked before signing in), the `signedIn` option and the `account` fixture. Verify that a spec with `signedIn: true` opens `/sheets` signed in.
- [x] 2.2 Remove the `setup` project and `auth.setup.ts`. Cap the workers at 7. Verify that a full run sends at most one sign-in email per slot, plus the new-account test's own.
- [x] 2.3 Add the two scenarios from the spec to `e2e/fixtures.spec.ts`: no data from an earlier run, and no data from another worker. Verify they pass with 2 workers.

## 3. Shared helpers

- [x] 3.1 Add `createSheet`, `createCollection`, `newMark` and `delay` to the fixtures, in one copy each. Verify with the specs that use them in 4.1.
- [x] 3.2 Add `hold`/`release`, `answerAtOnce` and `settled`, each with a case in `e2e/fixtures.spec.ts`. Verify the cases pass on both projects.

## 4. Specs move over

- [x] 4.1 Change every spec that used `authFile`, its own `createSheet`, `createCollection`, `newMark` or `holdBack` to use the fixtures. Leave the scenarios as they are. Verify that no spec defines those helpers or imports `authFile` any more, and that `just e2e` passes, apart from the flaky tests known in #180.

## 5. CI evidence

- [x] 5.1 Turn on `trace: "on-first-retry"` and `screenshot: "only-on-failure"`. Add a JSON reporter in CI. Verify that a test made to fail once leaves a trace in `test-results`.
- [x] 5.2 In `ci.yml`, add an always-run step that writes flaky and failed test titles to the job summary, and one that uploads `apps/web/test-results`. Verify on the PR's CI run that the summary lists any flaky test and the artifact is there.

## Workflow follow-up

- Open the PR with "Closes #181", then archive the change once it's merged.
