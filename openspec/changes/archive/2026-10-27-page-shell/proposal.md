# Proposal

## Why

The editor has the Workbench look (editor-facelift), but the pages around it don't: no top bar, no side panel, and a home page with three plain lines. This is M2g's fourth step: the page shell and the home page from the mockups.

## What Changes

- A top bar on the home page and the editor page: "Sheet Library", linking home. On the editor page it also shows the song's title, "Amazing Grace", except on a phone, where only the name fits. The `/design` page and the e2e harness don't get it.
- The editor page shows "Amazing Grace" as its heading, and its browser tab reads "Amazing Grace | Sheet Library". The key chip on the boards is left out, since sheets have no key yet.
- A side panel on the editor page holds the prototype notice and how to edit. In a window at least 1024px wide, it sits beside the editor and stays in view while the page scrolls. In a narrower window, a help button in the top bar opens it as a modal sheet from the right, and the prototype notice moves onto the page above the song.
- The help depends on the main pointer. With a finger: "With touch", then the keys. With a mouse: the keys, then "With a mouse". The keys name both Ctrl K and ⌘ K. The text follows the boards; M2g's UI text step polishes it.
- One set of widths for every layout rule: phone up to 640px, middle up to 1023px, wide from 1024px. The phone sizes and the badges above the lyrics move from 600px to 640px, where the toolbar already docks.
- The home page from the boards: a headline, the "coming soon" text, the "Try the chord editor" button, and a tilted sample sheet. The sample is static markup for now; issue #23 replaces it with a read-only view from `chord-editor`.
- The old hint paragraph above the editor goes away; the panel replaces it.
- Leaving the editor page with edits asks first, with the browser's own prompt: by the top bar's link, a reload, closing the tab or going back. Without edits, it doesn't ask.

## Capabilities

### New Capabilities

- `site-layout`: the top bar shared by the site's pages.
- `home-page`: what the home page shows.

### Modified Capabilities

- `editor-page`: the song title and browser title, the side panel with the help, where the prototype notice sits, and a warning before leaving with edits.

## Impact

- `apps/web/app`: `TopBar` and `SidePanel` components, a `breakpoints.ts` with the media queries, the `--scrim` token, the `close` icon, the home and editor routes, and the 600px rules in `tokens.css`, `sheet-editor.css` and `section-toolbar.css`.
- `apps/web/e2e`: tests for the top bar, the panel and the home page.
- `docs/`: `design/` copies refreshed from the canvas, `design-direction.md` (the panel, the widths, `--scrim`), `roadmap.md` (the step is done, and a "Later" line for issue #23).
