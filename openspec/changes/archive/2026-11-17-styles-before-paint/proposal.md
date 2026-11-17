# Proposal

## Why

On a move between screens, a phone can paint the new page for one to three frames before its styles apply. Each route has its own stylesheets, and `<Links>` adds them in the same commit as the page. React Router waits for the files to download but not for them to apply, and a stylesheet added by script doesn't hold back painting. Leaving a route removes its stylesheets, so coming back has the same gap. On a collection, the rows show as bare underlined links for a moment (#151). The transitions in #136 need pages that are styled from their first frame, so this comes first.

## What Changes

- All of the app's CSS is built into one stylesheet (`build.cssCodeSplit: false`). React Router links it on the root route, so it loads with the first page as a normal stylesheet and is never added or removed on a move. A first load fetches one file instead of 10 to 21.
- The CSS is split into cascade layers, in this order: `tokens`, `base`, `editor`, `components`, `pages`. In one file the bundler decides the order of the rules, and it puts the root's base rules last. The layers make that order not matter.
- The layer order is declared in an inline `<style>` in the root's `<head>`, before the stylesheet, so it holds whatever order the rules have in the file.
- The chord editor package's CSS goes into the `editor` layer, so the app's rules for the editor still win over it.
- A check that no stylesheet is added or removed on moves between the main pages.
- Components keep importing their own CSS. No dependency is added.
- Not in this change: loading the main pages offline (#141). One stylesheet means a page opened offline will already have its styles, but the route modules are still missing.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `site-layout`: a page reached by a move shows with its styles from its first frame.
- `design-system`: a page looks the same whether it was loaded in full or reached by a move.

## Impact

- `apps/web/vite.config.ts`, `app/root.tsx`, `app/app.css`, `app/ui/tokens.css`.
- Every CSS file under `apps/web/app/`, each wrapped in its layer.
- `app/editor/sheet-editor.tsx`: the package's CSS moves from a JS import to an `@import … layer(editor)`.
- `harness/` pages, which reuse app components, get the same layer order.
- A new e2e test for moves between pages.
- First load: one file of about 13.6 KB gzipped. Home grows the most, from about 4.2 KB in 10 files.

## Open Questions

- Is about 9 KB more CSS on the home page fine for new visitors' first page?
- React Router copies the server build's own `style.css` into the client folder, unlinked. Leave it, or remove it after the build?
