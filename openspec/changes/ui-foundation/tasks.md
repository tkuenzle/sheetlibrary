# Tasks

## 1. Housekeeping and mockup copies

- [x] 1.1 Archive the completed `publish-editor` change in its own commit. Verify `openspec list` no longer shows it and `openspec/specs/editor-page/spec.md` exists.
- [x] 1.2 Copy the canvas's `project/*.dc.html` files into `docs/design/`, with a README that links the canvas, says the canvas wins, and says the folder goes away at the end of M2g. Verify the file list matches the canvas's file listing.

## 2. Tokens and font

- [x] 2.1 Add `@fontsource-variable/schibsted-grotesk` and `@material-symbols/svg-500` to `apps/web` at exact versions. Verify `pnpm install` succeeds and the lockfile pins both.
- [x] 2.2 Write `app/ui/tokens.css`: the role tokens from the Foundation board (with `--focus` and `--shadow`), type sizes, spacing steps and corners. Lamplight applies under the system's dark mode unless `data-theme="light"` is set, and wherever `data-theme="lamplight"` is set. Verify every value against the board.
- [x] 2.3 Load the font from the package and preload the latin file of the lyrics weight in `root.tsx`. Verify in the built app that the font file is served from the site's origin.
- [x] 2.4 Remove the placeholder properties from `app.css`, set `--chord-editor-*` from the role tokens, and move the home page, the editor page and the chord input to role tokens. Verify with `rg -- '--color-|--space-[0-9]|--radius\b|Canvas|GrayText' apps/web/app` that nothing old is left, except the section toolbar's styles in the package.
- [x] 2.5 Add e2e tests: on `/` and `/editor` no font or icon request goes to another origin and Schibsted Grotesk is in use; with a dark color scheme the page has the lamplight `--page` background. Verify `just e2e` passes.
- [x] 2.6 Check `/` and `/editor` in light and dark with the `browser-check` skill, on desktop and phone. Verify text is readable and only colors and the font changed, not the layout.

## 3. Labels after the font loads

- [x] 3.1 Make the chord layer place its labels again when `document.fonts` finishes loading. Verify with a harness e2e test that holds back the font response, then releases it, and checks that each label sits over its letter.

## 4. Icons and base components

- [x] 4.1 Add `app/ui/icons.ts` with the icons the mockups use, imported as SVG with `?raw`, and an `Icon` component. Verify a unit test renders one as an SVG and that the build only contains listed icons.
- [x] 4.2 Add `Button` (filled, tonal, text), `IconButton`, `Toolbar`, `Popover` and `Note` in `app/ui/`, each with its own CSS on the role tokens only, and a transparent border or outline for forced colors. Verify unit tests: `IconButton` needs a label and uses it as its name, and `Toolbar` has the `toolbar` role.
- [x] 4.3 Add `Tooltip` and use it in `IconButton`: it shows after a short delay on hover, right away on keyboard focus, hides on Escape, and never shows on touch. Verify with e2e tests on `/design` in dev for hover, focus and Escape.
- [x] 4.4 Check the components in forced colors mode (Playwright `forcedColors: "active"`). Verify each one has a visible outline.

## 5. Design page

- [x] 5.1 Add the `/design` route in `routes.ts` only for `CLOUDFLARE_ENV=preview` and the dev server. It shows every component and its states side by side in `data-theme="light"` and `data-theme="lamplight"`, with a `noindex` robots tag. Verify it opens in `just dev`, and an e2e test gets 404 for `/design` from the production build.
- [x] 5.2 Compare `/design` with the canvas's Foundation board in both styles with the `browser-check` skill. Verify colors, type, corners and icons match, and note any difference that is a deliberate choice.

## 6. Docs

- [x] 6.1 In `docs/design-direction.md`, add `--focus` and `--shadow` to the role table and say where the tokens and components live. Verify the table matches the Foundation board.
- [x] 6.2 In `docs/roadmap.md`, mark the tokens step done with what it decided (self-hosted font, SVG icons, React components, the preview-only design page). Say that the editor facelift starts by moving the section toolbar's buttons to React, with the package keeping placement, docking and focus. Verify it matches `design.md`.

## 7. Integration

- [x] 7.1 Run `just check`. Verify it passes.
- [ ] 7.2 After pushing, open `/design` on the pull request's preview link. Verify it shows both styles.

## Workflow follow-up

- Archive the change after review, in the same pull request.
