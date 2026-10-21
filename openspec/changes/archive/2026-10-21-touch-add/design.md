# Design

## Context

The chord layer already handles adding by mouse: it finds the letter, and the app opens the chord input from `onAddChord(pos)`. Touch presses go to the editor and place the caret. The chord input already opens the keyboard on iOS, because it is focused during the tap.

Measured in phone emulation: an active line is 62.6px, the text 22px, and the band below the text about 20px. Letters are 4 to 15px wide.

## Goals / Non-Goals

**Goals:**

- Reuse `onAddChord` and the chord input. The app doesn't change.

**Non-Goals:**

- Moving the button when the page scrolls. See the proposal's open questions.
- Finding out whether the phone's own Paste menu is open. A tap on the caret, or on Android's caret handle, may show that menu next to the button. This is tried without handling it first.

## Decisions

**A button at the caret, not a "+" in the band.** The caret picks the letter, so the button doesn't have to be letter-sized. It floats over the text and can be 44px tall. A "+" in the band below the text, as on desktop, would be about 20px tall, since the next line's labels sit right under it. A bar fixed above the keyboard was the other option, but iOS Safari doesn't shrink the page for the keyboard, so keeping a bar on top of it is unreliable.

**Above, not below.** The finger tapping from below covers what is under the caret, Android draws its caret handle there, and the keyboard is at the bottom. Above is also where chords go. The button covers the line's own chords, but only until typing or the chord input hides it. The phone's menus also sit above the caret, but they show for a selection, where the button doesn't, or for a tap on the caret, which isn't handled yet (see Non-Goals). Below was the first choice, because of those menus, but it covered the next line and needed a gap large enough to clear the caret handle.

**The button shows once the caret has settled.** On a tap, the browser sends the click before it moves the caret, so a button shown on the click flickered at the old caret first. Instead, a caret move during a tap starts a short timer, about 150ms, and the button shows when it runs out with no finger down. Every move restarts it. So the button never shows at a passing caret, or under the loupe while the caret is dragged. A tap that doesn't move the caret changes nothing.

**The chord layer owns the button.** It sees the presses on the editor, so it knows whether a finger placed the caret. A touch press starts a tap. A key, a mouse press, a drag or the editor losing focus ends it and hides the button. The button keeps the editor's focus on press, so the keyboard stays open. A tap on it calls `onAddChord` with the caret's position.

**The gap is a custom property, tuned on a phone.** It sets how far the button sits from the text, and so how much of the line's chords it covers. `/sheet-editor?add-offset=<length>` sets it to try values, as `?lift` does for dragging. The default is 0.5em, chosen on the preview link.

**Tried on Android, not on an iPhone.** On an Android phone, with the preview link, the button works well. No iPhone was at hand; the roadmap makes that pass a step before M2f.

**Room is read from the visual viewport.** If the button's top is above the visible area, it goes below the caret. The layer places it again on `visualViewport` resize and scroll, since the keyboard opens after the tap.

## Risks / Trade-offs

- [The button covers labels of the line, so a tap there hits the button] → It hides while typing, and a tap elsewhere moves the caret and the button.
- [The phone's Paste menu shows next to the button after a tap on the caret] → Fine on Android. Check on the iPhone before M2f. If it gets in the way, find a way to tell when the menu is open.
- [iOS may not report the finger lifting after its own caret gesture, so the button never shows after a caret drag] → Check on the iPhone before M2f.
- [The editor has problems on an iPhone] → Not tried yet. The iPhone pass before M2f covers the button and the existing editor, and problems it finds get their own change.
