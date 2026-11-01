# Design

## Context

The Worker (`apps/web/workers/app.ts`) only hands requests to React Router and has no bindings. `/` is prerendered at build time. Previews are versions of one worker, `sheetlibrary-preview`, so they share its bindings. The pull request token only reaches that worker. D1 tokens can't be limited to one database yet: D1 Edit covers the whole account.

## Decisions

**Better Auth runs in the Worker, under `/api/auth/*`.** `workers/app.ts` sends those paths to Better Auth and everything else to React Router. Bindings only exist per request, so the auth instance is made per request from `env`, with its base URL taken from the request's origin. That lets every preview URL work without a list of origins.

**Better Auth reads D1 directly if the installed version supports it, and otherwise through a Kysely D1 dialect.** Its schema comes from the Better Auth CLI and is committed as SQL in `apps/web/migrations/`, in wrangler's D1 migrations format.

**Pages get the session through React Router middleware.** The worker passes `env` in the router context. A root middleware reads the session once per request, and loaders read it from the context. `/` is no longer prerendered: its top bar needs the session, and a prerendered page would show "Sign in" to everyone. The other choice was to check the session in the browser, which makes the link flicker.

**Invite-only comes from Cloudflare, not from our code.** The email goes out through the `send_email` binding. On Workers Free, Cloudflare refuses recipients that aren't verified addresses, so the worker turns that refusal into the "invite-only" note. Verified addresses are account-wide, so previews have the same invite list. Moving to Workers Paid opens sign-up with no code change. The other choice, an invite list in our database, would need its own admin screen.

**Passkeys use the request's host as their domain.** On production the domain is `sheetlibrary.com`. On previews it is the account's `*.workers.dev` subdomain, so one passkey works on every preview and never on production. This is the first thing to try on a real preview.

**Rate limits are kept in D1.** Better Auth's limiter with database storage covers each visitor. Memory storage wouldn't work, because each Worker isolate has its own. Per address, the worker counts that address's recent sign-in links before sending. As a starting point: 3 emails per address per 15 minutes, 10 per visitor per hour.

**Production migrates in the deploy job, previews migrate themselves.** The deploy job runs `wrangler d1 migrations apply --remote` before `wrangler deploy`, with the production token. Previews can't do that without D1 Edit on the whole account. So the preview worker bundles the migration files and applies the missing ones through its own binding, which only reaches the preview database. It records them in wrangler's `d1_migrations` table, the same way wrangler does. The preview job calls this route after `wrangler versions deploy`. The route only exists when a var set in wrangler's `preview` env is present; production answers 404. Once D1 tokens can name one database, the preview job uses wrangler too and the route goes away.

**Databases are created by hand and imported.** `wrangler d1 create` makes both databases first. `infra/` takes them over with `import` blocks, as it did with the zone, and guards them with `prevent_destroy`, since they hold people's accounts. Their ids are known before the pull request merges, so `wrangler.jsonc` can bind them in the same pull request. The `preview` env repeats the `d1_databases` and `send_email` bindings, since wrangler doesn't inherit them.

**Pull request plans leave out the databases and email sending.** Reading them needs D1 or email permissions on the whole account, and D1 Read can run queries. The plan token would then reach production sessions and sign-in links. `infra-plan` passes `-exclude` for these resources. Only the deploy on main, with the production token, plans and applies them. Sign-in mail comes from `mail.sheetlibrary.com`, set up by hand and imported like the databases, with message previews off.

**The auth secret is set by hand.** `BETTER_AUTH_SECRET` is set once on each worker with `wrangler secret put`. Secrets stay across deploys and versions, so CI never handles them.

## Risks / Trade-offs

- [Cloudflare's email sending is in beta, and how the binding refuses an unverified recipient isn't documented.] → Check the refusal first on a preview. If it can't be told apart from other failures, show one note that covers both.
- [Passkeys might not accept `*.workers.dev` as their domain.] → Try it early. If it fails, previews sign in by email link only.
- [Anyone can call the preview's migration route.] → It only applies migration files already in that preview, so calling it again changes nothing.
- [Two pull requests that change the schema at the same time break the shared preview database.] → Only one such pull request is open at a time. If it happens anyway, drop the preview tables in the dashboard and redeploy.
- [Workers Free allows 10 ms of CPU per request.] → There are no password hashes, and passkey checks use WebCrypto. Check the CPU time in the dashboard after the first sign-ins.

## Migration Plan

1. Before merge: create both databases, set `BETTER_AUTH_SECRET` on both workers, and add the first invited addresses in Cloudflare.
2. Merge: `infra/` imports the databases and sets up email, the deploy job applies the migrations, then deploys.
3. Rollback: revert the pull request. The tables stay, which is harmless.

## Open Questions

- How long a session lasts. Better Auth's default is kept for now.
- What the email says and which address it comes from.
