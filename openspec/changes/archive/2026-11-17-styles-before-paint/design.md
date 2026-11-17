# Design

## Context

About 50 CSS files under `apps/web/app/`, each imported by the component or route that uses it, plus the chord editor package's `style.css`. The build splits them into 31 chunks, and each route links between 10 and 21 of them. React Router preloads a route's CSS before a move (`prefetchStyleLinks`), but inserts the `<link rel="stylesheet">` in the same commit as the page. There are no cascade layers and no `!important`. Class names are prefixed per component, and overrides use compound selectors, so little depends on the order of files, but nothing guarantees it.

A spike built the app with `build.cssCodeSplit: false`. React Router's Vite plugin supports it (`getCssCodeSplitDisabledFile`): the root route links one `style.css` of 79 KB (13.6 KB gzipped), and no other route links CSS. In that file, `tokens.css` and `app.css` come last and `.button` first. The server build's copy had the same rules in another order.

## Goals / Non-Goals

**Goals:**
- No stylesheet is added or removed after the first load.
- The result of the cascade doesn't depend on where the bundler puts a rule.

**Non-Goals:**
- Changing how components import their CSS, or how the CSS is written.
- Preloading route modules for offline use (#141).

## Decisions

**One stylesheet through `cssCodeSplit: false`.** One line in `vite.config.ts`, supported by React Router, and every import stays where it is. The root route is matched on every page, so its `<link>` never changes, and the server renders it in the `<head>`, where it holds back the first paint. Considered: React 19's `<link precedence>` for each route. It needs every import rewritten as `?url` plus a `<link>`, or a custom `<Links>` on `UNSAFE_FrameworkContext`. Stylesheets would pile up in the order pages were visited, so the cascade would depend on history. Considered: importing every file from `app.css` and removing the imports in components. It gives the same file, but breaks the rule that a component brings its own CSS.

**Five layers, assigned by folder.** In order of priority, lowest first:

| Layer | Files |
|---|---|
| `tokens` | `ui/tokens.css` |
| `base` | `app.css` |
| `editor` | the chord editor package's `style.css` |
| `components` | `ui/`, `shell/`, `sheets/`, `collections/`, `editor/`, `photos/`, `sheet-view/`, `home/` |
| `pages` | `routes/` |

This matches the order a page had before, with the root first and the route last, and keeps the app's editor rules above the package's. Each file wraps its rules in `@layer <name> { … }`, so you can see a file's layer when you open it. `@import` and `@font-face` stay outside. Considered: a PostCSS plugin that wraps each file by its folder. The files wouldn't show their layer, and a moved file would change layer without anyone noticing.

**The order is declared inline in the root's `<head>`.** The first `@layer` statement the browser sees fixes the order. The root's CSS is last in the bundle, so a statement in `app.css` would come too late. A `<style>` with `@layer tokens, base, editor, components, pages;` before `<Links />` comes first on every page, in the build and on the dev server. The harness pages get the same `<style>`. Considered: a build step that prepends the statement to `style.css`. It does nothing on the dev server.

**The package's CSS is imported in a layer.** `sheet-editor.tsx` stops importing `chord-editor/style.css`. `sheet-editor.css` starts with `@import "chord-editor/style.css" layer(editor);`. The package stays as it is. Unlayered, its rules would beat every layered rule of the app.

**The check counts stylesheets, not frames.** An e2e test records every stylesheet or `<style>` added to or removed from `<head>` while it moves between Sheets, Collections, a collection, the account page, a sheet and its Edit view, and back. It expects none. Timing frames with a slowed CPU would be flaky. The e2e tests run against the production build, so they test the real file.

**The look is compared by screenshots once.** Before and after, a script takes screenshots of each main page on a phone, at 800px and wide, in both styles. They must match. This is done once, in this change, not as a lasting test.

## Risks / Trade-offs

- [A rule that relied on its file's place, or on its specificity across layers, now loses] → A page's rule wins over a component's even when the component's selector is more specific, so a more specific selector can't fix it. The screenshot comparison finds it. Move the rule to the right layer, usually the file of whoever renders the element. Two cases came up: the save status's look in the bar moved from `sheet-bar.css` to `sheet.edit.css`, and "New sheet" in the rail keeps the 16px start padding that `button.css` used to give it over `shell.css`.
- [Vite drops `layer(editor)` from the `@import`] → Check the built file. If it does, wrap the package's `style.css` in `@layer chord-editor { … }` and add that name to the order instead.
- [The dev server still injects CSS per module] → With the layer order first in `<head>`, the cascade gives the same result there, so dev looks the same. Only the timing differs.
- [Any CSS change invalidates the whole file in caches] → It is 13.6 KB gzipped. Acceptable.
