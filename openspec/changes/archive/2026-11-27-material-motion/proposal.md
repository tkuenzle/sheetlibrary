# Proposal

## Why

Our motion tokens use Material 3's curves, but we never said how closely we follow Material 3, and we don't always pair curves and durations the way it does (#187). #185 found one case: a fade of opacity alone on the decelerate curve was barely visible. Material 3 doesn't give one answer either. Its motion doc and its library's code disagree on the fade, the fade through and the shared axis.

## What Changes

- `docs/motion.md` says how we follow Material 3, in this order: our own constraints first (off the main thread, page moves at 300ms or less, reduced motion, calm), then Material 3's reasoning (the curve by role, the duration by area, its fade patterns), then its numbers as defaults wherever our constraints don't object. Each difference is written down with its reason.
- Page moves stay at 300ms or less, because taps land on the pictures while a view transition plays. Material 3's 400 and 500ms moves assume a platform where a tap can interrupt a move.
- Photo import on a phone, which nearly fills the screen, slides up in 300ms instead of 200ms and down in 200ms instead of 150ms. The smaller surfaces that slide in from an edge keep 200ms in and 150ms out: the docked chord input, the key, capo and View panels on a phone, the opened rail and help. No new tokens: `--motion-long` and `--motion-medium` take on large surfaces next to their current roles.
- The curve for large surfaces that come in (photo import on a phone, and the sheet rising over the shell) is chosen after a side-by-side comparison in the design canvas: our standard decelerate against Material 3's emphasized decelerate.
- What only fades, with nothing moving alongside, fades linearly: the scrims, "Close" under the "New sheet" ways, and the fades behind the edge panels and the key panel on a phone.
- These stay as they are, with the reason in `docs/motion.md`: the shell's screens crossfade rather than fade through, since a fade through would make the rail blink; no springs; overlays grow from 0.95 rather than Material 3's 0.8; the "New sheet" ways rise one after another.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `design-system`: a bottom sheet that nearly fills the screen takes longer to slide in and out than a smaller one.

## Impact

- `photos/photo-import-dialog.css`, `shell/page-moves.css` (if the rise's curve changes), and the scrims and fades in `ui/confirm-dialog.css`, `ui/floating-button.css`, `editor/import-button.css`, `shell/edge-panel.css` and `editor/key-button.css`.
- `ui/tokens.css` (comments, and a token for the emphasized curve if it is chosen), `docs/motion.md`, `docs/design-direction.md`'s motion paragraph.
- `e2e/overlay-moves.spec.ts`: photo import's durations.
- A new "Motion" page in the "Sheet Library UI" design canvas.

## Open Questions

- Should overlays leave with a fade only, as Material 3 does, instead of shrinking back? It could go on the comparison page too.
- The skeleton's pulse, the loading bar and the photo import's sign still repeat on numbers, not tokens (open since #137). Add tokens for them here?
- The `chord-editor` package uses `ease-out` and the browser's default `ease`, not our curves. Fix it here?
- An overlay's opacity next to its scale stays on `--ease-enter`, so it arrives early, much as Material 3's fade does. Should `docs/motion.md` state that as a rule?
