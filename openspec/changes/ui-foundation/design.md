# Design

## Context

`apps/web/app/app.css` has placeholder properties (`--color-chord`, `--color-surface`, `--space-*`, `--radius`) and `system-ui`. `packages/chord-editor` has no framework. It is styled through `--chord-editor-*` properties, except its section toolbar, a ProseMirror plugin view that builds its buttons with `document.createElement` and hard-codes `Canvas`, `8px` and `18px`. The chord input is React, in `apps/web`, and gets its position from the editor through `onAddChord`.

The chord layer places labels by measuring the lyrics. It places them again when a `ResizeObserver` on the editor fires. A font that loads late changes the widths of letters but often not the editor's height, so the labels stay where the fallback font put them.

## Goals / Non-Goals

**Goals:**

- One place for the role tokens. Every component uses only them.
- The boundary the editor facelift builds on: the package owns behavior and what's drawn on the text, and the app owns the chrome.

**Non-Goals:**

- Restyling or moving the section toolbar, the chord input, sections or chord labels. That is the editor facelift.
- Dimmed sections in `--text-dimmed` and `--chord-dimmed` colors instead of opacity. Also the facelift.
- A switch for light and lamplight.

## Decisions

**The package owns behavior, the app owns the chrome.** `chord-editor` keeps what depends on the editor view: what's drawn on the text (labels, "+", dash, drop caret), and later the toolbar's placement, docking and focus handling. The app draws buttons, icons, popovers and UI text with its design system. The chord input already works this way. The section toolbar is the exception, and the editor facelift moves its buttons to React as its first tasks. Rejected: shared CSS classes that the package sets on its own buttons. The engine would then depend on the app's class names, icons and wording.

**React components with plain CSS.** `Button` (filled, tonal, text), `IconButton`, `Tooltip`, `Toolbar`, `Popover` and `Note` live in `apps/web/app/ui/`, each a `.tsx` with its own `.css`, like the existing routes. The variants are props. `IconButton` requires a label, used as its accessible name and shown in its tooltip. `Popover` is the surface only: the caller places it, as the chord input does today.

**Tooltips on hover and keyboard focus, not on touch.** A tooltip shows after a short delay when the pointer rests on its button, and right away when the button gets keyboard focus. Escape hides it. It is only a visual copy of the label, linked with `aria-describedby` only when it adds text beyond the name. Touch gets none: there is no hover, and a tooltip on long press is hard to discover and would fire while the user only wants to press. Icon-only buttons on touch need icons clear enough on their own, which the facelift checks. Rejected: the native `title` attribute, which can't be styled, shows late, and never shows on keyboard focus.

**Forced colors now, reduced motion later.** In forced colors mode, tonal and filled surfaces lose their backgrounds and blend into the page. Each component gets a transparent border or outline, which forced colors turns into a system color. That costs one line per component, and adding it later would mean checking every component again. The base components don't animate, and the tooltip appears without a transition, so reduced motion has nothing to turn off yet. It comes with the editor facelift, which owns the editor's motion (the touch lift, the toolbar's fade).

**Tokens in one file, styles by attribute.** `app/ui/tokens.css` defines the role tokens, the type sizes, the spacing steps and the corners. Light is the default. The system's dark mode switches to lamplight, unless an element has `data-theme="light"`. `data-theme="lamplight"` switches any element to lamplight. The design page uses the attribute to show both styles side by side. A later switch only sets it on `<html>`. `--focus` and `--shadow` come from the canvas, and `--border` stays its own role. The placeholder properties are removed, and `--chord-editor-*` are set from the role tokens.

**Self-hosted font, pinned.** `@fontsource-variable/schibsted-grotesk`, at an exact version. Vite bundles its files with hashed names, served from our origin. The font is an input to the chord layout, so a change to it is a commit the e2e tests see. A font from Google can change behind the same URL. Self-hosting also works offline, which a local-first app needs, and sends no visitor IPs to Google. Since browsers partition their caches by site, Google's CDN has no cache advantage left. The latin file of the lyrics weight is preloaded in `root.tsx`.

**Labels placed again when fonts load.** The chord layer listens to `document.fonts` `loadingdone` and places its labels again. Rejected: `font-display: block`, which hides the text for up to 3 seconds and still doesn't promise the font arrives before the first layout. Also rejected: a fallback font with adjusted metrics, which only gets close.

**Icons as inline SVG, committed.** Material Symbols Rounded, weight 500, drawn for 24px, as on the canvas. They are saved from Google's static icons into `app/ui/icons/`, so they change only with a commit. An `Icon` component takes an icon name from a fixed list in `app/ui/icons.ts`, which imports each SVG with `?raw`, so only listed icons ship. Rejected: the `@material-symbols/svg-*` npm packages, whose icons are drawn for 48px and look too thin at 24px. Also rejected: the Material Symbols font. It shows the ligature text ("arrow_upward") until it loads, and a subset needs its own build step.

**The design page only in preview builds and dev.** `routes.ts` runs at build time and adds `/design` only when `CLOUDFLARE_ENV` is `preview` or the dev server runs. The production build doesn't contain the route at all. Rejected: a check in the loader, which would still ship the page to production. The page has a `noindex` robots tag.

**Copies of the mockups.** `docs/design/` gets the canvas's `project/*.dc.html` files and a README that says the canvas wins and the folder goes away at the end of M2g.

## Risks / Trade-offs

- [The design page reaches production because the build check is wrong] → An e2e test asks the production build for `/design` and expects 404.
- [A font update moves chords] → The version is exact. Updates come as their own commits, with the e2e tests.
- [The fallback font shows briefly before the font loads] → Preloading the lyrics weight keeps it short. The labels follow when the font loads.
- [Lamplight looks wrong on today's layouts, which were never drawn for it] → Check `/` and `/editor` in both styles with the `browser-check` skill. Only colors are in scope; layout issues wait for the facelift.
