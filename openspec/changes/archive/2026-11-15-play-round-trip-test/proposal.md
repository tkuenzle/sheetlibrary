# Proposal

## Why

"switches to the editor and back, keeping the key and capo" in `apps/web/e2e/play.spec.ts` fails often (#143). It makes `just check` fail with no real fault, so a real failure is easy to miss.

The cause is not the one #143 guessed. "Edit" loads the editor in full, and the test clicks the title before React has hydrated the page. The click does nothing, so the rename never happens and nothing is saved. The wait for "Saved" then passes because nothing changed, and the play view shows the old title. Four failing runs out of 40 all show this: the title field never opened, no `PUT` was sent, and "Play" was clicked about 150ms after the title.

## What Changes

- After the editor loads, the test waits for a chord label before it clicks the title. Chord labels are drawn in the browser, so this means the page has hydrated. `openSheet` in `sheet.spec.ts` already waits this way.
- After Enter, the test checks that the editor shows "Grace". It then waits for the status to clear and then read "Saved", like `sheet.spec.ts` does. If a click is missed again, the test fails at that step instead of at the end.
- The test passes with `--repeat-each 20` on both projects.

Only the test changes. The app does not.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The app's behavior doesn't change, so the change skips specs.

## Impact

- `apps/web/e2e/play.spec.ts`: the one test.

## Open Questions

- Should a hydration marker in the app, with a shared test helper for full page loads, be parked as its own issue?
- Should #143 get a comment with the real cause, since its notes point at the wrong one?
- The untracked `apps/web/e2e/zz-play-fix.spec.ts` would not fix this. Can it be deleted?
- The collection rename and D1 errors noted in #143 are not covered here. Do they need their own issue?
