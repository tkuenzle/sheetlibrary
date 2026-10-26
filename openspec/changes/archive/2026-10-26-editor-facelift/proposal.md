# Proposal

## Why

The tokens, font, icons and base components are in place (ui-foundation), but the editor still has the prototype's look: dimmed sections by opacity, a plain toolbar above the section, and a plain chord input. This is M2g's third step: the editor in the Workbench look from the mockups.

## What Changes

- The section toolbar's buttons move to React in `apps/web`, built from `Toolbar`, `IconButton` and `Button`. The app renders the toolbar; `chord-editor` only places it, keeps focus in the editor, and tells the app which section is active and whether the toolbar is docked.
- With a mouse, the toolbar is a vertical pill in the left margin, beside the active section: a large "Add chord" icon button, then "Move section up" and "Move section down". Its tooltips open to the right. In a section taller than the window, it follows the scroll and stays in view.
- The toolbar is docked when the main pointer is a finger, and also when the window is too narrow for the margin. The app sets that rule. Docked, it shows the move buttons next to the word "Move", and a separate "Chord" button with a "+" icon.
- The move buttons use the "move up" and "move down" icons, an arrow beside a stack of blocks, not plain arrows. Plain arrows next to a section count read as stepping through the sections.
- Each section shows its number in a round badge: left of the lyrics, on a tablet too, or above them in a narrow window, as on a phone. Screen readers read it as "Section 2".
- The active section is a sheet on the page. Other sections are dimmed with the `--text-dimmed` and `--chord-dimmed` colors instead of opacity.
- The selected and the dragged chord label are pills. The "+" below the lyrics is a round dot.
- The chord input is restyled with `Popover` and `Button`. Its behavior doesn't change. The package now tells the app where to place it, so the app no longer asks ProseMirror for coordinates.
- With reduced motion, the touch lift and the toolbar's fade don't animate.
- In forced colors mode, the active section's sheet and the selected label's pill keep an outline.
- **BREAKING** for the package's styling: `chord-editor` keeps custom properties only for what its layout measures. Looks (colors, corners, shadows) are styled by the app through the package's documented state classes. `--chord-editor-dimmed-opacity`, `--chord-editor-chord-color`, `--chord-editor-dash-color` and `--chord-editor-toolbar-room` go away.

The top bar, the title, the side panel and the prototype note are not part of this step. They come with the page shell.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `chord-editor`: the toolbar sits beside the section and follows the scroll, and docks on narrow windows too; "+ Chord" becomes "Add chord"; sections get numbered badges; motion respects reduced motion; the active section and selected label stay visible in forced colors.

## Impact

- `packages/chord-editor`: `section-toolbar.ts` places an element it gets from the app, the callbacks that open the chord input pass where to place it, and `style.css` loses its looks, documents its state classes and gets the badge counter.
- `apps/web`: a `SectionToolbar` component, the editor's styles on the role tokens, the restyled chord input, the harness.
- `apps/web/e2e`: toolbar tests use the new button names and places.
- `docs/`: `design-direction.md` (the package and app boundary), `roadmap.md` (the step is done).
