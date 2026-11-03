# Proposal

## Why

Since #51, signing in with an email link lands in the library, so the account page's passkey offer no longer appears (#80). Without a passkey, every sign-in waits for an email.

## What Changes

- After an email sign-in, the library shows a card that offers to add a passkey for this device. It shows only when the account has no passkey yet and this device hasn't closed the offer before.
- The card sits under the heading, above the sheets or "No sheets yet", in the note colors. It holds "Add a passkey to sign in on this device without waiting for an email.", the button "Add passkey" and a close button named "Close". The look is on the canvas's "Library and account" page, under "Passkey offer".
- "Add passkey" opens the account page, where the person adds the passkey. The library never asks the device itself.
- "Close" hides the card and remembers that on this device, in a cookie. The offer doesn't come back on this device. A passkey can still be added on the account page.
- A reload of the library doesn't bring the offer back, as a reload of a new sheet doesn't open its title field again.
- A passkey sign-in never shows the offer.
- `docs/ui-text.md` and `docs/design-direction.md` record the offer.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `accounts`: brings back "Offer a passkey", now in the library, with the account check and the close button.

## Impact

- `apps/web/app/auth/auth-client.ts`: the email link's landing URL marks an email sign-in.
- `apps/web/app/routes/sheets.tsx`, `sheets.css`: the loader decides whether to offer, and the library shows the card.
- `apps/web/e2e/library.spec.ts` or `account.spec.ts`: the offer after an email sign-in.
- `docs/ui-text.md`, `docs/design-direction.md`.
- No API change, no migration, no new dependencies.
