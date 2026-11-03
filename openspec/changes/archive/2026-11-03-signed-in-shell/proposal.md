# Proposal

## Why

The sign-in and account pages from #49 were built from the existing components but never designed, and the signed-in top bar was never decided (#79). The design canvas's "Library and account" page now has the chosen designs: top bar A and sign-in B.

## What Changes

- The top bar no longer shows the song's title after the site's name, on every page, `/editor` included. The title is only the heading.
- On a sheet, the top bar starts with "Library" and a back arrow instead of the site's name. It opens the library. "Sheet not found" on `/sheets/:id` gets it too.
- Once signed in, the account is a round initial at the end of the top bar: the email's first letter, linking to the account page. On the account page, it shows as the current page. Signed out, "Sign in" stays as today.
- The sign-in page has no top bar. The site's name sits above one card that holds the sign-in, and later "Check your email".
- On the sign-in page, "Send link" becomes the main button and "Sign in with a passkey" a tonal one, since everyone's first sign-in is by email.
- The account page uses the library's grouped rows: the email is one row, the passkeys a group with "Add passkey" under it, and "Sign out" is its own row with an icon.
- `docs/design-direction.md` records these decisions.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `site-layout`: the top bar's start on a sheet, the account as a round initial, no title in the bar, and no top bar on the sign-in page.
- `editor-page`: the song's title is no longer in the top bar.

## Impact

- `apps/web/app/shell/top-bar.tsx`, `top-bar.css`, `signed-in.ts`, and `apps/web/app/root.tsx`: the bar and what the root loader passes to it.
- `apps/web/app/routes/sign-in.tsx`, `account.tsx`, `sheet.tsx`, `editor.tsx`, `sheets.tsx` and their CSS.
- A new `logout` icon in `apps/web/app/ui/icons/`.
- Unit and e2e tests that find the top bar's links by name or check the title in it.
- `docs/design-direction.md` and `docs/ui-text.md`.
- No API change, no migration, no new dependencies.

## Open Questions

- On a phone, the sheet's top bar holds "Library", the help button and the initial. The canvas draws this at 390px; is that enough room on narrower phones?
