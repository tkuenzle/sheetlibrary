# Design

## Context

`section-toolbar.ts` is a ProseMirror plugin view. It creates its own `<div>` and buttons with `document.createElement`, inserts the div after `view.dom`, places it, and removes it when no section is active. `SheetEditor` in `apps/web` creates the `EditorView` inside a `<div className="chord-editor">` that React renders.

The package's `style.css` mixes two things: layout the chord layer depends on (font, line heights, the lift), and looks (chord color, dash color, dimmed opacity, the toolbar's buttons). The package already marks state with classes on elements it creates: `is-editing`, `is-active`, `is-selected`, `is-dragging`, `is-lifted`, `is-dimmed`, `is-inert`. The app sets `--chord-editor-font` and `--chord-editor-chord-color` in `app.css`.

## Goals / Non-Goals

**Goals:**

- Each DOM element has one owner: React or the package, never both.
- The app styles the editor with its role tokens directly, without one custom property per look.

**Non-Goals:**

- The page layout around the editor (top bar, title, side panel). That is the page shell.
- Moving the `EditorView`'s creation into the package. `SheetEditor` still creates it.

## Decisions

**The app renders the toolbar, the package places it.** `SheetEditor` renders a `SectionToolbar` component as a sibling of the editor's mount, always present and `hidden` while no section is active. It passes the element to `createEditorState`. The plugin no longer creates, moves or removes the element. It calls `onSectionToolbar({ index, count, docked })`, or `null` when no section is active, and the app renders the buttons from that. Pressing a button calls back into the package: a move, or opening the chord input at the caret, which comes back through the same callback as a click below the lyrics. The plugin keeps everything that needs the editor view: the position, docking, keeping the caret above the docked toolbar, scrolling after a move, and keeping focus on pointerdown, through a listener on the element.

Rejected: the package creates the element and the app renders into it with a portal. React would render into a node that the plugin creates, moves and removes, which breaks when React unmounts. Also rejected: the app places the toolbar from section geometry. Placement needs the caret, the keyboard on iOS and the toolbar's height, which only the view has.

**Split who writes what on the toolbar element.** React writes its content, its class and `hidden`. The package writes only the inline `top`, `bottom` and `height`, and the attributes `data-section-toolbar`, `data-docked` and `data-moving`. Toggled classes would be wiped when React renders `className` again. The package's CSS uses these attributes for behavior only: absolute or fixed position, z-index, hiding while the visible area moves on iOS or while a chord is dragged. The app's CSS draws the pills. The package also places the toolbar again when React changes it, with a `MutationObserver` on `hidden` and its children: the app shows the toolbar and renders the docked content after the callback, so the placement, the room below the page and the caret check must wait for it. A `ResizeObserver` on the toolbar would fire again each time the placement sets its height.

**Beside the section, the package sets only the height.** Not docked, the package sets the element's `top` and `height` to the active section's, so it spans the section. The app's CSS puts it in the left margin, which its layout reserves, and makes the toolbar inside it `position: sticky`. So the toolbar stays in view in a tall section and stops at the section's bottom, and the browser moves it while scrolling, without lag. The margin's width is the app's layout, so it stays out of the package. Rejected: moving `top` with the window on each scroll event. The toolbar would lag a frame behind the page.

**The package tells the app where to place the chord input.** Every callback that opens the chord input passes an anchor with the position or chord: the letter's left edge, top and bottom, in window coordinates like `getBoundingClientRect`. The app converts it to its own frame. That covers a click below the lyrics, a click on a label, Ctrl+K or Cmd+K, and "Add chord" in the toolbar, which asks the package to open the input at the caret instead of reading the selection itself. The app no longer calls `coordsAtPos`. It still keeps the input inside the frame's width, since that depends on the input's own size. Rejected: leaving it in the app. The app would be the only place outside the package that knows how ProseMirror measures positions.

**The app sets when the layout is compact.** `createEditorState` takes `compact`, a media query, with `(pointer: coarse)` as the default. The app passes `(pointer: coarse), (max-width: …)`, with the width where the margin no longer fits. When it matches, the toolbar docks, and the package sets `data-compact` on the editor's mount, the `.chord-editor` element. CSS can't read a media query that only lives in JS, so the app's margin keys on `data-compact`. It is a data attribute because React owns that element's `className`. The `has-docked-toolbar` and `is-adding` classes the package sets there today move to data attributes for the same reason. Rejected: a fixed breakpoint in the package. The page shell will change the column widths again.

**Looks go to the app; the package publishes state hooks.** The package keeps custom properties only for layout its own CSS and the chord layer need: `--chord-editor-font`, `--chord-editor-font-size`, `--chord-editor-line-height`, `--chord-editor-active-line-height`, `--chord-editor-section-gap` and `--chord-editor-touch-lift`. Colors, backgrounds, corners and shadows are set by the app's CSS on the package's state classes. On elements the package creates, the existing `is-*` classes are the hooks; they need no change. On elements React owns, the hooks are `data-*` attributes. `style.css`'s header documents both lists. Without the app's CSS, the editor still works, in `currentColor`.

This is not the coupling ui-foundation rejected. There, the package would have used the app's class names on its own buttons. Here, the app depends on hooks the package publishes. Rejected: a custom property per look, which would roughly triple the properties and grow with every detail of the mockups.

**Badges are a CSS counter in the package.** `.ProseMirror` resets a counter, each `.section` counts, and `.section::before` shows it, with `user-select: none`. Generated content can't be edited. Its alternative text, `content: counter(section) / "Section " counter(section)`, makes screen readers say "Section 2" instead of a bare "2". The badge is absolutely placed. The app makes room for it with the section's padding and places and styles it through `.section::before` and `.section.is-active::before`. The package owns only the counter and what the badge says. Rejected: a grid and a badge size in the package. Where the badge sits depends on the section's padding, which is the app's. The badge sits left of the lyrics, and above them only in a narrow window, which the app's CSS checks with a `max-width: 600px` media query. That is the phone width, where the type sizes get smaller and the docked toolbar spreads to the window's edges, so the phone layout starts at one width. The toolbar docks a bit earlier, at 640px, where the margin beside the section runs out. A tablet docks the toolbar but has room for the badge beside the lyrics, so the badge doesn't follow `data-compact`. It renumbers itself on every move, split and join, with no code. Rejected: a widget decoration per section. It is more code for a number, and widgets are a known cause of caret trouble. It can replace the counter once sections have names.

**Reduced motion in the package's CSS.** Both animations are the package's: the touch lift (`is-lifted`) and the docked toolbar's fade (`data-moving`). A `prefers-reduced-motion: reduce` block turns their transitions off.

**Outlines for forced colors in the app's CSS.** Forced colors drop backgrounds, so the active sheet and the selected pill would vanish. The app gives both a transparent outline, which forced colors turns into a system color, as the base components do. They are looks, so they live with the looks.

## Risks / Trade-offs

- [The badge column or the section's padding moves letters, and labels end up off their letters] → The layer measures letters where they are. The e2e tests that check labels over letters run on the new layout, in both projects.
- [Safari puts the caret on the `::before` badge] → The spec's scenario for the left arrow at a section's start, run in WebKit, and a check in the iOS Simulator with the `browser-check` skill.
- [Browsers without alternative text for `content` read only the number] → Chrome, Safari 17.4+ and Firefox 128+ have it. Others read "2", which is acceptable.
- [The toolbar follows the scroll, so after a move in a tall section it may not move by as much as the section] → The scroll after a move measures the toolbar before and after, as today, so its buttons stay under the pointer either way.
- [An app that sets no styles gets a plain editor] → Accepted. The harness imports `app.css`, so the e2e tests see the real look.
- [Breaking change to the package's properties] → The app is the only user. Its CSS moves in the same change.
