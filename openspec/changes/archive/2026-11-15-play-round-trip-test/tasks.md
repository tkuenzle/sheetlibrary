# Tasks

## 1. The test

- [x] 1.1 In `play.spec.ts`, after the editor loads, wait for a chord label (`.chord-label`) before clicking the title, as `openSheet` in `sheet.spec.ts` does. Verify the test still passes once.
- [x] 1.2 After Enter, check that the editor heading reads "Grace", then that the status reads "" and then "Saved". Verify the test still passes once.
- [x] 1.3 Run the test with `--repeat-each 20` on both projects, against a fresh `just build`. Verify all 40 runs pass.

## 2. Checks

- [x] 2.1 Run `just check` and verify it passes.

## Workflow follow-up

- The PR closes #143.
- Archive the change after review.
