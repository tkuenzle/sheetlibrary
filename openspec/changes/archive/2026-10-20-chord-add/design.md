# Design

## Context

A line is taller than its text (`--chord-editor-line-height`), and the text sits in the middle. Labels use the space above the text. The space below is empty, but it is part of the line, so a click there goes to the editor and places the caret. The chord layer sits over the editor with `pointer-events: none`; only labels take clicks.

## Goals / Non-Goals

**Goals:**

- Reuse what dragging has: `letterAt`, the drop caret, and the active-section check.

**Non-Goals:**

- Touch and pen. They keep today's behavior; touch-add handles phones.

## Decisions

**The band is the click target; the "+" is only a hint.** The chord layer listens for mouse moves and presses on the editor. A point is in the band when it is below the text of the row it is on, inside a line of the active section. A press there is stopped before the editor sees it, so the caret and the focus stay put. The click calls a new `onAddChord(pos)` option, and the app opens the chord input as the shortcut does. The "+" and the preview are drawn in the layer and take no clicks. Alternative: a clickable "+" element. It would move with the pointer, so the pointer would keep entering and leaving it, and the band around it would still place the caret.

**The band is measured, not fixed.** Whether a point is below the text comes from the letter's coordinates, so it follows the line height a page sets.

**The preview is the drop caret, in the lyrics.** It shows in front of the letter, as when a chord is dragged there, and the "+" sits right under it. Tried on the preview link: a caret at label height, with the "+" centered under the letter, sat right above the labels of the line below and looked like it belonged there. In the lyrics, it marks the letter. A ghost label was the other option.

**The active section has more line height.** `--chord-editor-active-line-height` is `3.4em`, against `2.8em` elsewhere, so the "+" has room below the lyrics. The layout jumps when the active section changes. Tried on the preview link: a click in another section still puts the caret where it was aimed, and a selection started there needs a small correction, which is acceptable. Raising the line height everywhere was the alternative.

**`insertChord` keeps the caret.** At the end of a line, it adds a trailing space for the chord. If the caret is at the end of that line, the space would push it forward. It maps the selection as `moveChord` does, so the caret stays before the space.

## Risks / Trade-offs

- [A click just below the text used to place the caret and now opens the chord input] → The "+" shows before the click, and Escape or Cancel closes the input without a change.
- [The "+" sits close to the labels of the line below and may look like it belongs there] → The caret in the lyrics marks the letter, and the active section has more room below each line.
- [Text in a section moves when it becomes active, so a drag that starts there may select a bit more or less than aimed] → Accepted; a click still lands where it was aimed.
