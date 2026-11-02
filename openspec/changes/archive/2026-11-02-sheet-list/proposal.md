# Proposal

## Why

Sheets are stored online since #50, but nothing in the UI leads to them or creates one. The library gives a signed-in person a place to find their sheets and start a new one (#51).

## What Changes

- A library page at `/sheets` lists the person's sheets, newest edit first. Each row shows the title, the artist and when the sheet was last edited, and opens the sheet.
- "New sheet" creates a sheet titled "Untitled" with no lyrics yet and opens it at `/sheets/:id`.
- A person with no sheets sees an empty state with "New sheet".
- `/` sends signed-in people to the library. Visitors still see the home page.
- Once signed in, "Sheet Library" in the top bar leads to the library instead of the home page.
- Signing in lands in the library, by email link or passkey. The account page's passkey offer after an email sign-in goes away; #80 brings a prompt to the library.
- Signed-in people can no longer reach the home page or its link to `/editor`. That is fine until #78 decides the demo's fate.

The look follows the "Library and account" page of the design canvas (see design.md).

Not part of this change:

- Renaming a sheet, and the sheet's menu (#76). Until then a new sheet stays "Untitled".
- Deleting a sheet (#77).
- "Import" in the library, and what happens to the `/editor` demo (#78).
- The account initial in the top bar, "← Library" on the sheet page, and the sign-in and account pages (#79).
- A hint such as "Type or paste the lyrics" in a new sheet's empty section.

## Capabilities

### New Capabilities

- `library-page`: the page that lists a person's sheets and creates new ones.

### Modified Capabilities

- `home-page`: signed-in people are sent to the library.
- `site-layout`: the site's name in the top bar leads to the library once signed in.
- `accounts`: signing in lands in the library, and the passkey offer after an email sign-in is removed until #80.

## Impact

- `apps/web/app/sheets/sheets.server.ts`: a list of a person's sheets, newest edit first. The `(userId, updatedAt)` index already serves it.
- `apps/web/app/routes.ts` and a new `routes/sheets.tsx`: the library page, its loader and the action that creates a sheet.
- `apps/web/app/routes/home.tsx`: a loader that sends signed-in people on.
- `apps/web/app/shell/top-bar.tsx`: where the site's name links to.
- `apps/web/app/auth/auth-client.ts`, `routes/sign-in.tsx` and `routes/account.tsx`: where sign-in lands, and the welcome offer comes out of the account page.
- `docs/ui-text.md`: words for the library.
- No new dependencies, no migration and no infrastructure changes.
