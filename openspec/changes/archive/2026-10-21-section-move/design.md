# Design

## Context

The active-section plugin (`active-section.ts`) follows the active section by its position. When the old position maps to a different section after a change, it cleans up the old one. The chord layer's floating "+ Chord" already follows `visualViewport` on resize and scroll, and keeps the editor's focus by cancelling `pointerdown` and `mousedown`.

In phone emulation, a "+ Chord" for a caret near the end of a section's first line reached about 31px above the line and opened under the move buttons, so a tap on it moved the section.

## Decisions

**One toolbar instead of floating parts.** The section's actions sit together, so they can't collide. "+ Chord" no longer appears at the caret, so it no longer needs the settling timer, the flip below the caret, or a place clear of the phone's Paste menu. The cost is reach: the button is no longer where the thumb just tapped. Rejected: more room above the section, which only moved the buttons out of the way; buttons below the section, which the keyboard often hides; and letting "+ Chord" step below the caret, which needs the two parts to know about each other.

**Up and down together.** Splitting them, up at the top of the section and down at the bottom, separates two buttons that are used together, and one of them can be off-screen in a tall section. Centring them would cover the lyrics, since there is no margin beside the text on a phone.

**Docked on touch, above the section with a mouse.** On a phone with the keyboard open, a toolbar above a long section is often scrolled away. Docked at the bottom of the visible area, it stays in reach. The browser places it, with `position: fixed; bottom: 0`, so it moves in the same frame as the page while scrolling. On Android, `interactive-widget=resizes-content` in the viewport meta tag shrinks the page for the keyboard, so `bottom: 0` is above it. Safari ignores that setting, so on iOS the toolbar is lifted by the part of the page the keyboard covers, read from `visualViewport` on its resize and scroll events, the way Discourse docks its composer. The first version placed the toolbar from `visualViewport` on every platform, to have one code path; on Android it lagged a frame behind while scrolling with the keyboard open, and looked bad. The VirtualKeyboard API (`env(keyboard-inset-height)`) would also place it with CSS, but only in Chromium, and with it the page no longer makes room for the keyboard, so keeping the caret visible above the keyboard would become the editor's job.

**The main pointer decides.** `(pointer: coarse)` picks the docked toolbar. It doesn't flip with each tap, as a rule based on the last pointer would, so the layout doesn't jump. A laptop with a touchscreen gets the toolbar above the section.

**The caret stays above the docked toolbar.** After a change to the caret or the text, and after the visible area changes, as when the keyboard opens, the toolbar scrolls the page by how far the caret's line is hidden behind it, or above the visible area. ProseMirror's `scrollMargin` was the other way, but it is a fixed value and only applies to ProseMirror's own scrolling, not to the browser's when the keyboard opens. Plain scrolling by the user is left alone.

**Room after the page.** Docked, the toolbar covers the bottom of the window, so at the end of the page it hid the Done button on `/sheet-editor`. While docked, a spacer as tall as the toolbar follows the page's content (`body::after`), so the end of the page can be scrolled clear of it.

**Hidden while a chord is dragged.** Docked, the toolbar covered the spots near the window's bottom where a dragged chord can land, and the zone that scrolls the page down. It hides while a label is dragged.

**A move is one replace of both sections, swapped.** It replaces the active section and its neighbour with the two in the other order, in one transaction, and puts the caret at the same offset in the moved section. The old active position falls inside the replaced range, so the plugin sees it as deleted and cleans nothing up. Moving with a delete and an insert would map the old position into the neighbour and clean that up by mistake. Each move closes the history, so quick presses are separate undo steps.

**Pressing again.** With a mouse, the toolbar notes its top before a move and scrolls by how far it shifted. Docked, it doesn't shift, and the move scrolls the caret into view, clear of the toolbar.

**A plugin view of its own.** The toolbar lives in its own file, not in the chord layer. It reads the active section from the plugin state and calls the existing `onAddChord` with the caret's position, so the app doesn't change.

**Room above the active section only with a mouse.** With `(pointer: fine)`, the active section gets 48px above its first line for the toolbar. Docked, it needs none.

**On iOS, hidden while the visible area moves.** In the iOS simulator (iPhone 17 Pro, iOS 26), the toolbar sat in the right place at rest, just above Safari's address pill and the keyboard's own bar. While scrolling with the keyboard open, Safari moved the visible area inside the page, and the toolbar moved with it until the correction arrived: 25 to 35px off while scrolling, about 130px when bouncing at the end. No positioning avoids that on iOS. So where the keyboard covers part of the page, the toolbar fades out while the visible area moves and comes back about 150ms after it stops. A second try in the simulator showed a gap: with the keyboard open, Safari lets the page scroll past its end, into the area behind the keyboard, and pulls it back. The toolbar came back while the page was held there and jumped with the pull-back. So it also hides on page scroll, and waits until no finger is down. With that, it looks good in the simulator. A real iPhone is still part of the check before M2f. Rejected: placing it above the section while the iOS keyboard is open, which shifts the text when the keyboard opens and loses the toolbar in long sections; and an app shell, where the page never scrolls and the sheet scrolls in its own container, which changes the whole page layout and still isn't reliable when iOS scrolls the caret into view.

**Above the page's floating parts.** Docked, the toolbar acts like the browser's own bars: the page scrolls under it, including the app's chord input, which used to be drawn over it.

**Tried on Android.** With the preview link on an Android phone: scrolling with the keyboard open is smooth since the toolbar is placed by the browser, the chord input stays inside the window and scrolls under the toolbar, pressing move several times in a row works with the caret in view, and the docked toolbar doesn't feel cramped. The first try found the toolbar lagging while scrolling, the chord input widening the page, and the chord input drawn over the toolbar; all three are fixed.

## Risks / Trade-offs

- [On iOS, with the keyboard open, the docked toolbar lags behind while scrolling, as it did on Android before the fix, or `visualViewport.offsetTop` is stale after the keyboard closes, as one iOS 26 report says] → Check during the iPhone pass before M2f. Until WebKit supports `interactive-widget`, a web toolbar above the iOS keyboard can't avoid the lag.
- [`interactive-widget=resizes-content` applies to the whole site: on Android, every page gets shorter while the keyboard is open] → Nothing uses `100vh` yet. Pages that do later should expect it.
- [In a long section, the toolbar above it is out of reach with a mouse when the caret is far down] → The mouse "+" below the lyrics and Ctrl+K still add chords there.
- [The docked toolbar takes about 52px of an already small visible area on a phone] → It didn't feel cramped on Android.
