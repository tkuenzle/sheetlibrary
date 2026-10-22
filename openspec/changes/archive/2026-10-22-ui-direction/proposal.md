# Proposal

## Why

The pages are plain: system fonts, system colors and a long hint paragraph. M2g in `docs/roadmap.md` is the UI polish. It should be a real facelift, not tuning a few values, so it starts with a direction and mockups before any code. This change is that first step.

## What Changes

- A design canvas on claude.ai (a Design artifact). It is the source of truth for the look. It holds:
  - 2–3 direction boards: polished concepts for practicing at home. They differ in the arrangement of the page, the toolbar and the buttons, not only in fonts and colors. One is picked before the rest is drawn.
  - They redesign today's features only. Basic additions such as a title, section headers or the key may appear, marked as proposals and kept rough. Features we don't have are not designed.
  - The chord input is only restyled. Its UX will change and gets its own change.
  - The editor in the picked direction, in all its states, on desktop, tablet (portrait, on a music stand) and phone.
  - Rough sketches of later screens: a library list and a view for playing.
  - A foundation board: type, palette, spacing, buttons and the popover. It shows the palette in light and in a dark version ("lamplight").
  - A placeholder wordmark: "Sheet Library" in the chosen font.
- Fonts are picked from Google Fonts. Where they are served from is decided in the tokens step.
- `docs/design-direction.md`: the picked direction and why, the list of role tokens, and the link to the canvas.
- `docs/roadmap.md`: M2g is split into its steps, and a real logo goes on the "later" list.

No code changes. Tokens, the editor facelift, the page shell and the UI text are later steps of M2g.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The app's behavior doesn't change, so the change skips specs.

## Impact

- `docs/`: a new `design-direction.md` and an updated roadmap.
- A new private Design artifact on claude.ai, linked from `docs/design-direction.md`.

## Open Questions

- Should the text in the mockups set the tone of voice for the UI text step, or is voice left to that step?
- Which editor states does the tablet size show? The default is the main editing states and the play view sketch, not every state.
