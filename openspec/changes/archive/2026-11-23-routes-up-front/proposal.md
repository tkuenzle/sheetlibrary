# Proposal

## Why

React Router finds the app's routes lazily. It remembers discovered addresses, not routes, so the first open of each sheet in a session can wait for a round trip to `/__manifest` before anything else happens. It discovers the links on a page ahead of time, but gives up when their addresses don't fit in one request (about 280 links), and a tap can come before it's done. On the preview, that round trip and the wait for the data together pass the loading bar's 200ms, and the page opens without a move. With 50–100ms of latency, every first open of a sheet was cut, and every reopen rose.

## What Changes

- A stack change: the whole route list comes with the first page (`routeDiscovery: { mode: "initial" }` in `react-router.config.ts`). It is 21 routes, about 13.6KB, 1.8KB gzipped.
- No page change asks `/__manifest` which route an address leads to.
- Split from #141, which needs this to open pages offline too. Preloading the routes' code stays in #141.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `site-layout`: a page change doesn't wait to look up which page an address leads to.

## Impact

- `apps/web/react-router.config.ts`.
- Every first page load carries the whole route list.
- `e2e/page-moves.spec.ts`: a test that opening a sheet asks for nothing but its data. `e2e/play.spec.ts` drops its note and filter for `/__manifest` requests.

## Open Questions

- Should the e2e tests fail on any `/__manifest` request, so lazy discovery can't come back unnoticed?
