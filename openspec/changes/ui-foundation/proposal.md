# Proposal

## Why

M2g's direction is picked and drawn (see `docs/design-direction.md`), but the app still uses placeholder values: system fonts, system colors and plain buttons. The editor facelift and the page shell need the role tokens, the font, the icons and the base components first. This is the second step of M2g.

## What Changes

- The role tokens from the canvas, with a light and a lamplight style. The page follows the system's dark mode, as today.
- Schibsted Grotesk, served from our own site, not from Google Fonts.
- Material Symbols Rounded icons as inline SVGs, only the ones we use.
- React base components in `apps/web`: button, icon button, tooltip, toolbar, popover and note, styled with plain CSS on the role tokens. They stay visible in forced colors mode (Windows high contrast).
- The existing pages use the role tokens and the font instead of the placeholder values. Their layout doesn't change yet.
- The chord editor places its labels again when the font finishes loading.
- A `/design` page shows the components in both styles. It exists only in previews and local dev, not on sheetlibrary.com.
- The completed `publish-editor` change (M2f) is archived, which it wasn't when it merged.
- `docs/design/` holds copies of the canvas's `.dc.html` files, as `docs/design-direction.md` describes. `docs/design-direction.md` gets the `--focus` and `--shadow` tokens from the canvas. The roadmap's facelift step notes that the section toolbar moves to React there.

## Capabilities

### New Capabilities

- `design-system`: the styles, where fonts and icons are served from, and the page that shows the base components.

### Modified Capabilities

- `chord-editor`: chord labels stay over their letters when the font loads after the editor.

## Impact

- `apps/web`: tokens, fonts, icons, components, the `/design` route, and the CSS of the home and editor pages.
- `packages/chord-editor`: placing labels again after fonts load.
- New dependencies: `@fontsource-variable/schibsted-grotesk` and `@material-symbols/svg-500`.
- `docs/`: `design/`, `design-direction.md`, `roadmap.md`.
- `openspec/`: `publish-editor` moves to the archive, and its `editor-page` spec becomes a main spec.
