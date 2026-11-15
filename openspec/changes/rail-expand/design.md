# Design

## Context

`SidePanelButton` in `shell/side-panel.tsx` already opens the sheet's help as a modal `<dialog>` from the right on middle screens. It slides in, slides out on Escape, "Close" or a backdrop click, skips the motion with reduced motion, closes when the window gets wide, and renders its content only while open. The opened rail needs all of this, from the left.

The shell renders three navigations, and CSS shows one: the rail, the compact rail and the bottom bar. `useFocusOnNavigation` in `shell/focus.ts` puts focus on the new page's heading after a move.

## Goals / Non-Goals

**Goals:**
- One edge panel for the help and the rail, so #89 and #136 change the motion in one place.

**Non-Goals:**
- Making the menu button work before the scripts load. The compact rail's links already work then, so nothing is lost. The help button behaves the same way today.
- Changing the motion itself. It stays as the help panel has it, until #89.

## Decisions

**A shared `EdgePanel` in `shell/edge-panel.tsx`.** It takes the side (left or right), whether it is open, what to do once it has closed, a media query that closes it, and its name. It owns `showModal()`, the slide in and out, Escape, the backdrop click and the media query. It renders its children only while open. The caller owns the button and the content, including its header. `SidePanelButton` keeps its API and uses it inside, so the sheet pages don't change. Its CSS moves to `edge-panel.css`, with the side as a data attribute that sets the edge, the rounded corners and the slide direction.
Alternative: a dialog opened by the native `command="show-modal"` button, animated with `@starting-style`. It would work before the scripts load, but the help would still work the other way, and the exit motion isn't supported everywhere. Rejected for now. #89 can come back to it.

**Picking an entry closes the panel at once, without the slide out.** While the modal panel is open, the page behind it is inert. If the new page arrives during a 150ms slide out, `useFocusOnNavigation` can't focus its heading, and closing the dialog then sends focus back to the menu button. Closing at the click returns focus to the menu button first, and the move then puts it on the heading. The panel catches a click on any link inside it. The loading bar shows the wait.

**The panel sits beside the compact rail, not inside it.** The full rail inside it is a `<nav>` named "Main", so the panel must not sit in the compact rail's `<nav>`. `ShellView` holds the open state, passes the menu button to the compact rail, and renders the panel after it. `NavRail` gets two slots: content at the top of the compact form (the menu button), and content after the site's name in the full form (the close button).

**The compact items look like the bottom bar's.** The icon sits in a 56x32 pill that marks the open screen, with the name under it in 12px type. This follows the "Sheets, middle" board. The `Tooltip` and the `aria-label` go, since the name is now text. The rail is 88px wide.

**The panel closes outside the middle width.** Its media query is `phone` or `wide` from `breakpoints.ts`, joined with a comma. The help passes `wide`, as today.

**The opened panel is 304px wide**, with the rail filling it, as on "The rail, opened" board.

## Risks / Trade-offs

- [Moving the help onto the new panel could change it] → The existing tests for the help panel stay as they are and must pass. Check it by hand on a sheet at 800px.
- ["Collections" is the longest name under an icon. At 12px it fits in 80px, but at 200% text it doesn't] → A name that doesn't fit breaks onto a second line, with a hyphen where the browser hyphenates, instead of being cut off.
