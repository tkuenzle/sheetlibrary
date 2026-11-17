# Tasks

## 1. Baseline

- [x] 1.1 Before changing anything, write a Playwright script in the scratchpad that screenshots home, `/editor`, sign-in, Sheets, Collections, a collection, the account page, a sheet and its Edit view, at 390px, 800px and 1280px, in light and lamplight; run it against the current build and verify all 54 screenshots are saved

## 2. One stylesheet

- [x] 2.1 Set `build.cssCodeSplit: false` in `apps/web/vite.config.ts`; verify with `pnpm build` that `build/client` links one `style-*.css` on the root route and no other route lists CSS in the manifest
- [x] 2.2 Add an e2e test that records every stylesheet and `<style>` added to or removed from `<head>` while moving between Sheets, Collections, a collection, the account page, a sheet and its Edit view, and back; verify it passes on the phone and chromium projects and fails with `cssCodeSplit` back on

## 3. Layers

- [x] 3.1 Add `<style>` with `@layer tokens, base, editor, components, pages;` before `<Links />` in `app/root.tsx`, and the same in `harness/index.html` and `harness/sheet-view.html`; verify it is the first stylesheet in `<head>` of a server-rendered page
- [x] 3.2 Wrap `ui/tokens.css` in `@layer tokens` and `app.css` in `@layer base`, keeping `@import` outside; verify with `pnpm lint` and `pnpm format:check`
- [x] 3.3 Move the package's CSS from the import in `sheet-editor.tsx` to `@import "chord-editor/style.css" layer(editor);` at the top of `sheet-editor.css`; verify the built `style.css` holds the package's rules inside `@layer editor`
- [x] 3.4 Wrap every CSS file in `ui/`, `shell/`, `sheets/`, `collections/`, `editor/`, `photos/`, `sheet-view/` and `home/` in `@layer components`, and every file in `routes/` and `harness/harness.css` in `@layer pages`; verify no unlayered rule is left in the built `style.css` apart from `@font-face`, and `pnpm test` (including the widths test) passes
- [x] 3.5 Add a short "Layers" paragraph to `docs/design-direction.md`: the five layers, which folder goes in which, and that the order is set in `root.tsx`; verify it matches the design's table

## 4. Checks

- [x] 4.1 Run the screenshot script from 1.1 against the new build and compare; verify every screenshot matches, fixing any difference with a selector or the right layer, not with file order
- [ ] 4.2 With the browser-check skill, move from Sheets to a collection and back on a phone with the CPU slowed down 6×; verify no frame shows unstyled rows
- [x] 4.3 Run the full e2e suite; verify it passes
