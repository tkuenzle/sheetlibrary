# Tasks

## 1. The test harness

- [x] 1.1 Add `apps/web/harness/` with an `index.html`, an entry that renders `SheetEditor` with the seed song, Done and the JSON view, and its own Vite config without the React Router and Cloudflare plugins. Include it in typecheck and lint. Verify that `vite build` with the harness config succeeds and the page shows the song in a browser.
- [x] 1.2 Add a second Playwright web server that builds and previews the harness, and point `e2e/sheet-editor.spec.ts` at it. Remove the `?lift` test. Verify that all editor tests pass on both projects with `just e2e`.

## 2. The editor page

- [x] 2.1 Add the `/editor` route with `SheetEditor` and the seed song, a note that it is a prototype and nothing is saved, a short hint on how to edit, and a `noindex` robots tag. No Done button. Link it from the home page. Verify with Playwright tests against the app for the spec's "Opening the editor", "Reload after editing", "Reading the notice", "Robots meta tag" and "Following the link" scenarios.

## 3. Removing the old pages

- [x] 3.1 Remove `/sheet-editor` with its route and CSS, and `/spike/editor` with `app/spike/` and `e2e/spike-editor.spec.ts`. Update `home.test.tsx`. Verify that both paths return 404 in the built app, that nothing in `apps/web` refers to `/spike/editor`, `/sheet-editor` or `app/spike/` any more, and that lint, typecheck and all tests pass.
- [x] 3.2 Point the `browser-check` skill at `/editor` and the harness. Verify that its commands open the right pages.

## 4. Roadmap

- [x] 4.1 In `docs/roadmap.md`, mark M2f done: the editor is at `/editor`, the spike is gone, and the editor was tried in the iOS Simulator, not on a real iPhone. Verify the text matches the merged behavior.
