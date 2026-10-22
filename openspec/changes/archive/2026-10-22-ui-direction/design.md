# Design

## Context

`apps/web/app/app.css` already has placeholder custom properties (`--color-chord`, `--color-surface`, `--space-*`), and `packages/chord-editor/src/style.css` exposes `--chord-editor-*` properties. The section toolbar and the chord input still hard-code values such as `Canvas`, `44px` and `18px`. So the facelift will change markup as well as values, even though the roadmap's M2g said "values, not structure".

## Decisions

**Role tokens apart from a style's values.** The direction fixes a list of role tokens with stable names (for example `--surface`, `--text`, `--chord`, `--accent`, `--font-lyrics`). A style is one set of values for them. Components only use role tokens. A later style, such as one for the stage, then only needs a new set of values. The alternative, one set of tokens named after their values, would need a rewrite for every new style.

**A dark songbook as the test of that split.** The app follows the system's dark mode today, so dropping it would be a step back. A "lamplight" version (dark paper, warm ink) on the foundation board and one editor screen shows that the role tokens can carry a second style, before the stage style needs them.

**Concepts that differ in arrangement, not only in type and color.** A first round varied only fonts, colors and section markers on the prototype's layout, and looked like a restyled prototype. So the direction boards are polished concepts that each arrange the page, the section toolbar and the buttons differently. Fonts and colors follow from each concept.

**Direction: Workbench, with the section's tools beside the section.** Of the second round (Margin, Workbench, Highlighter), the user picked Workbench's overall style. The section's tools sit next to the active section, as in Margin, because they act on it. The side panel holds what isn't tied to the active section, such as how to edit. The next iteration, "Workbench 2", takes guidance from Material 3 Expressive: tonal color containers, large rounded corners, a floating toolbar with an emphasized main button. The user picked it, with plain round shapes (no scalloped section badge, a round "Add chord" button inside the pill toolbar) and an info note in the palette's own green-grey rather than blue.

**Icons: Material Symbols Rounded.** They fit Material 3 Expressive and cover icons we'll need later. Google Fonts serves them as a font, and a subset with only the icons we use keeps it small.

**Drafts are checked before they are shown.** Each board is rendered locally with Playwright and looked at before it is published to the canvas.

**The canvas is the source of truth.** The repo doesn't keep the mockups for good. While the facelift is being built, the canvas's `.dc.html` files are copied into `docs/design/`, with a README saying the canvas wins. Each later M2g step refreshes the copies when it starts, and the last one deletes the folder. They don't go into change folders, since archived changes stay forever and would drift. This change makes no copies.

**Fonts from Google Fonts.** They are open-licensed, so this doesn't decide hosting: the tokens step can still host them ourselves. Design artifacts can load Google Fonts, so the mockups show the real fonts.

## Risks / Trade-offs

- [The mockups promise layouts the editor can't easily do, for example around the chord layer or the docked toolbar] → The arrangement may change freely, but chords stay in a layer above the lyrics, and on touch the toolbar stays reachable above the keyboard. Anything beyond today's features is marked as a proposal.
- [The chord color doesn't have enough contrast on dark paper] → Check contrast for text and chords in both versions on the foundation board.
