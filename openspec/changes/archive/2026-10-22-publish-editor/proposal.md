# Proposal

## Why

The real editor is only on the test page `/sheet-editor`. The home page still links to the M1 spike. This is M2f in `docs/roadmap.md`: the editor with the seed song goes public, and the spike goes.

The editor's Playwright tests run against `/sheet-editor`, a page in the production build. Tests should not rely on a page we ship, so they move to a test page that is never built for production.

The roadmap asked for an iPhone check first. There is no iPhone at hand. The editor was tried in the iOS Simulator, and that is accepted as the check.

## What Changes

- New page `/editor`: the sheet editor with the seed song ("Amazing Grace"). Nothing is saved; a reload starts over. A note says it is a prototype and nothing is saved. It is `noindex`.
- `/editor` has no Done button. Escape or a click outside the sheet stops editing, as on the test page.
- The home page links to `/editor` instead of the spike.
- **BREAKING:** `/spike/editor` is removed and returns 404. Its code in `apps/web/app/spike/` and its Playwright tests go.
- **BREAKING:** `/sheet-editor` is removed. Its parts (seed song, Done, the stored sheet as JSON) move to a test page that only Playwright uses. The `?lift` parameter and its test go.
- Playwright tests against the production build only check the pages: home, `/editor` and the 404.
- `docs/roadmap.md`: M2f is done, the editor was tried in the iOS Simulator, not on a real iPhone.

## Capabilities

### New Capabilities

- `editor-page`: the public page with the editor and the seed song, how to get there, and that nothing is saved.

### Modified Capabilities

None.

## Impact

- `apps/web`: new `/editor` route, home page link, removed `/sheet-editor` and `/spike/editor` routes and `app/spike/`. A test page outside the app's routes, with its own Vite setup, served to Playwright. `e2e/sheet-editor.spec.ts` points at it.
- `.claude/skills/browser-check`: points at `/editor` and the test page instead of the old pages.
- `docs/roadmap.md`: as above. `docs/editor-spike.md` refers to code that is removed.

## Open Questions

- Should `/editor` be prerendered like `/`?
- Does the home page text change beyond the link ("Coming soon")?
- Should `docs/editor-spike.md` get a note that the spike's code is gone?
