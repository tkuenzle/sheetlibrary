# Design

## Context

Every place that moves writes its own numbers and its own `@media (prefers-reduced-motion: reduce)` block: `shell/edge-panel.css`, `editor/key-button.css`, `editor/chord-input.css`, `shell/view-button.css`, `ui/loading-bar.css`, `photos/photo-import-dialog.css` and the package's `style.css`. `sheet-editor.tsx` also checks `matchMedia` before it keeps the docked chord input around to slide out. Three places that close wait for their exit to finish: `EdgePanel` awaits `getAnimations()`, and the key panel and the chord input wait for `animationend`. The dimming of old search results has no reduced-motion rule at all.

## Goals / Non-Goals

**Goals:**
- Reduced motion is decided once, so a new part follows it without writing its own rule.
- What moves today keeps its durations and only takes the new curves, apart from the switch's handle and the active section.

**Non-Goals:**
- Menus, dialogs and page changes. The concept describes them; #136 builds them.

## Decisions

**Reduced motion sets the durations to 0s.** `tokens.css` defines `--motion-short` (150ms), `--motion-medium` (200ms) and `--motion-long` (300ms), and sets all three to `0s` inside `@media (prefers-reduced-motion: reduce)`. Parts keep their animations declared and only use the tokens. An animation of 0s still runs and ends at once, with `animationend` and a finished `getAnimations()`, so the closing logic needs no special case, and the `matchMedia` check in `sheet-editor.tsx` goes. Considered: one global rule that sets `animation: none` and `transition: none` on everything. It is one line too, but `animation: none` fires no `animationend`, so the key panel and the chord input would never close.

**The two loops keep their own rule.** The loading bar and the photo import's sign repeat forever, and standing still means a different look (the bar fills its width), not a shorter time. They keep their `@media` blocks. That leaves two rules for loops instead of seven, and none for things that open, close or change.

**Curves are Material 3's standard set.** `--ease-enter` is standard decelerate, `cubic-bezier(0, 0, 0, 1)`; `--ease-exit` is standard accelerate, `cubic-bezier(0.3, 0, 1, 1)`; `--ease-move` is standard, `cubic-bezier(0.2, 0, 0, 1)`. The style already follows Material 3, and these curves have no overshoot. Considered: today's `ease-out` and `ease-in`, which keep the current look exactly. The emphasized curves of Material 3 Expressive were left out as too lively for a calm app.

**The package gets its duration from a property.** `packages/chord-editor/src/style.css` uses `var(--chord-editor-motion, 150ms)` for the chord's lift and the docked toolbar, and keeps its own reduced-motion rule, so it still works on its own. The app sets `--chord-editor-motion: var(--motion-short)`, which is 0s with reduced motion. Considered: using `--motion-short` in the package directly. It ties the package to the app's tokens, and the package only takes `--chord-editor-*` properties.

**The switch's handle moves with `translate` and `scale`.** It stays 24px in the layout and is scaled down to 16px when off, so turning it on changes no layout and the browser doesn't lay out the bar each frame.

**The active section fades its colors.** `.section` and its label, lyrics and chords get a transition on `background-color` and `color`, at `--motion-short` with `--ease-move`. No size or position is transitioned: the active section's taller lines still change at once, so the chord layer's measurements are right as soon as the section is active.

## Risks / Trade-offs

- [A browser could skip `animationend` for an animation of 0s] → The e2e tests with reduced motion already open and close the docked chord input. A case for the key panel on a phone is added.
- [The active section's fade could lag while typing or arrowing quickly through sections] → It is only colors, at 150ms. Check it on a phone with the browser-check skill.
