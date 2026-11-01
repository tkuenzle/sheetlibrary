# Proposal

## Why

Sheets stored online (#50) belong to someone, so people need an account and a way to sign in (#49). Sign-in comes first, so storage never has to work without an owner.

## What Changes

- Accounts with Better Auth, stored in a new D1 database. An account holds only its email.
- Sign-in with a link sent by email. A new person signs up the same way. After an email sign-in, the site offers to add a passkey.
- Sign-in with a passkey, the main way back in.
- Invite-only to start. Email goes out through Cloudflare's email binding on Workers Free, which only reaches addresses verified in Cloudflare. An uninvited email gets a note instead of a link. Opening sign-up later means moving to Workers Paid, with no code change.
- An account page: the email, the passkeys (add, rename, remove) and sign-out.
- A "Sign in" link in the top bar, and a link to the account page once signed in.
- Sign-in emails are rate-limited.
- Infrastructure: a production and a preview D1 database, and email sending from mail.sheetlibrary.com, in `infra/`. Pull request plans leave them out, so pull requests never get access to production data. Invited addresses are added by hand, because the repository is public.
- Production applies database migrations before each deploy. The preview worker applies its own migrations through its binding, so pull requests still can't reach production. Previews are public and share one preview database.

Not part of this change:

- Deleting an account (#69).
- Changing the email, a display name, signing out everywhere.
- Passkey-first sign-up (only in Better Auth's beta).

## Capabilities

### New Capabilities

- `accounts`: signing in by email link and passkey, invite-only sign-up, and the account page.

### Modified Capabilities

- `site-layout`: the top bar links to sign-in or to the account page.
- `site-hosting`: production applies database migrations before it deploys, previews keep their own database, and pull request credentials can't change the production database.
- `infrastructure`: the D1 databases and email sending are in code, but invited addresses are not.

## Impact

- `apps/web`: Better Auth on the Worker under `/api/auth/*`, new `/sign-in` and `/account` pages, the top bar, `wrangler.jsonc` bindings, SQL migrations.
- `infra/`: two D1 databases (created by hand and imported, so their ids are known before merge), Email Routing and sending for the zone.
- CI: the deploy job applies migrations; the preview job asks the preview to apply its own.
- New dependencies: `better-auth`, its passkey plugin, and a Kysely D1 dialect if Better Auth can't use D1 directly.
- `docs/ui-text.md`: words for sign-in.

## Open Questions

- How long a session lasts before signing in again. The plan keeps Better Auth's default.
- Where an email sign-in lands. The plan uses the account page, since it holds the passkey offer.
- What the sign-in email says, and which address it comes from.
- Whether an expired or used link needs its own message, or the sign-in page is enough.
