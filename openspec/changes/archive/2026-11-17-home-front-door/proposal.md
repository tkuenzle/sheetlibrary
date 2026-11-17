# Proposal

## Why

Signed out, the home page says "Coming soon" and only offers the prototype editor. The app is close to its first version, and the page doesn't say what it does or offer a way in (#135).

## What Changes

- The home page says what the app is for: the heading "Every song you play, in one place", a line on what it does, and three things it can do (photos and Ultimate Guitar, a key for each singer, collections). "Coming soon" goes.
- Two ways in: "Sign in" opens the sign-in page, "Try it first" opens `/editor`. The board's "Sign in with email" became "Sign in", since the sign-in page offers a passkey first.
- The sample sheet becomes a card in the style of the sheet page: title, artist, the first verse, and working Key and Capo buttons that only show the sheet in another key. The key doesn't go into the address. The card is no longer hidden from screen readers. The tilt goes.
- On a phone or an upright tablet (below 1024px), the page is one column: the text and buttons, then the card, then the three features.
- `/editor` stays as it is. What becomes of it is a separate issue.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `home-page`: new text and ways in, a sample you can transpose, and the phone order.
- `ui-text`: the home page's text no longer says "coming soon" or asks to try the chord editor.

## Impact

- `apps/web/app/routes/home.tsx`, `home.css`, `home/sample-sheet.tsx` and `.css`, and their tests, including `e2e/home.spec.ts`.
- `editor/sheet-title.tsx`: `useSheetKey` always writes `key` and `capo` into the address. The home card needs a way to leave them out.
- `docs/ui-text.md` gets an entry for the home page.
- Design: the boards "Home, signed out" and "Home, signed out, phone" on the "UX overhaul" page of the design canvas.

## Open Questions

- The sign-in page says "Sheet Library is invite-only for now." Should the home page say so too?
- Should the page's meta description change from "A library for your sheet music." to the new line?
