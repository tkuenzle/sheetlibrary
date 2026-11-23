# Design

## Context

`react-router.config.ts` sets only `ssr: true`, so React Router discovers routes lazily: the first page carries only the routes it matched, and the client asks `/__manifest?paths=…` for the rest. It caches answers by address, up to 1,000. Links on a page are discovered in one request after they render, unless their addresses take more than 7,680 characters; then it discovers none of them. A navigation to an address not yet discovered asks first, before it loads the route's code or runs its loaders. Measured on the production build: the data request started 90–120ms after the tap, behind `/__manifest` and the code.

## Goals / Non-Goals

**Goals:**
- No navigation waits for route discovery.

**Non-Goals:**
- Loading the routes' code ahead of time (#141).
- Counting the wait for a page's data from the tap. That's in #171, and doesn't depend on this.

## Decisions

### Send the whole route list with the first page

`routeDiscovery: { mode: "initial" }`. The list is small: 21 routes, about 13.6KB, 1.8KB gzipped, on every first page load.

Alternatives:
- Keep lazy discovery and discover fewer links at once, so the request stays under its limit: still a round trip for a tap that comes first, and it depends on how many sheets and collections someone has.
- `discover="none"` on the rows: the navigation would then always ask first.

## Results

Measured on the production build, in one session with 50 and 100ms latency, ten opens each: no open asked `/__manifest`. A second sheet opened for the first time now rises; before, every first open of a sheet was cut. The session's first sheet is still cut at these latencies: it loads the sheet route's code first, which alone passes 200ms. That's #141.

## Risks / Trade-offs

- [Every first page load, the home page and sign-in too, carries routes it may not need] → 1.8KB gzipped. Accepted.
- [The list shows every route's path, the API's included, to anyone who loads a page] → Lazy discovery hands them out on request anyway, and every API route checks the session.
- [A tab opened before this deploy still discovers lazily] → Checked on the production build, with a tab open across the switch. The new server answers `/__manifest` with 404, React Router takes it as an error, and the tab shows "Something went wrong" on its first move to an address it hasn't discovered, until it is reloaded. A lazy build answers old tabs with "reload the page" instead, so a deploy that stays lazy works. Once both sides send the whole list, a deploy works too: the old tab knows every route, and when a route's code has changed, React Router reloads the page. So only tabs open across this one deploy are hit. Accepted: no one uses the app yet, and a reload fixes the tab. The Worker could answer `/__manifest` with 204 and `X-Remix-Reload-Document`, which React Router takes as "reload the page", if that changes.
