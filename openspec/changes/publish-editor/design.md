# Design

## Context

`e2e/sheet-editor.spec.ts` has about 64 tests against `/sheet-editor`. About 40 of them read the handed-back sheet: they click Done and parse the JSON the page shows. They drive the page with Playwright's mouse, keyboard and CDP (touch events, layout counts), so moving them to another test runner would mean rewriting them. Playwright runs against the production build, served by `vite preview`.

## Decisions

**The test page is its own small Vite app, not a route.** It lives in `apps/web/harness/` (an `index.html` and an entry that renders `SheetEditor` with the seed song, Done and the JSON view, as `/sheet-editor` does today). It has its own Vite config without the React Router and Cloudflare plugins, so it can't end up in the deployed build. Playwright gets a second web server for it: the editor tests use the harness, the page tests use the app. Rejected: a test-only route behind a build flag, which means the tests run against a different build than the one deployed, and the flag can leak into previews.

**The harness is built, not served by the dev server.** Its web server runs `vite build` and then `vite preview` with the harness config. So the tests keep running against minified production code, as now. The layout-count test in particular should not run against React's development build.

**The editor tests barely change.** They load the harness instead of `/sheet-editor`. Done and the JSON view stay, so `handBack` stays. The `?lift` parameter and its test go: touch-drag tuning is done, and no spec mentions the parameter.

## Risks / Trade-offs

- [Two web servers make the e2e run slower to start] → The harness build is small: one page, no server code.
- [The harness has no JSX plugin; it relies on Vite's own TypeScript and JSX transform] → Check while building it. If the transform falls short, add `@vitejs/plugin-react` to the harness config only.
