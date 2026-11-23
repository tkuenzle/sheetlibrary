# Proposal

## Why

A page change has to feel snappy when the data is fast. Today a page that moves in hands over its data at once, so even an answer in 50ms brings a skeleton for the whole move. Since #167, React shows the rows only after the move, which part of our hand timing from #137 still does again.

## What Changes

- A page change to Sheets, a collection, a sheet or the account page first waits up to 150ms for the data. If the data comes in time, the page moves in whole, with no bars. If it doesn't, the page moves in with bars, as today. A slow page now starts its move 150ms later. That is fine: it shows a skeleton anyway.
- A step back in the history works the same way. Today it always waits for all of its data, because the address has already changed when its loader runs. A slow Back then cuts without a move.
- After the browser's own move, such as Safari's swipe back, the page doesn't wait first. Its skeleton replaces the old page at once.
- When bars show, they show at once, with or without a move, and stay at least 400ms, as in the dialogs. React shows the rows when the move has ended. The 200ms of empty room for pages goes, and so does the check whether a move plays.
- The dialogs' bars ("Add sheets", "Choose collections") stay as they are.
- `docs/motion.md` describes the new timing.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `site-layout`: a page waits a moment for its data before it shows a skeleton, also on a step back; no wait after the browser's own move; bars never blink, with or without a move.

## Impact

- `shell/awaited.tsx`: a helper for the head start and the hold; `PageSkeleton`, `holdBars` and their state go. `fromAnotherPage()` compares with the page on screen, not the address.
- `shell/page-moves.ts`: `movePlays()` goes. The loaders learn whether the browser already moved.
- `shell/slow-wait.ts`: the 150ms constant. `SKELETON_HOLD` now holds a page's bars too.
- The client loaders in `routes/sheets.tsx`, `routes/collection.tsx`, `routes/sheet.tsx` and `routes/account.tsx`.
- `e2e/loading.spec.ts` and `e2e/page-moves.spec.ts`: the tests for bars without a move change, and new tests pin React's timing.
- `docs/motion.md`.

## Open Questions

- Edit still waits for all of its data and cuts when it's late. Should it get the head start too?
- The first visit to a kind of page loads its code before the data request starts, which uses up part of the 150ms. #141's preloading would help.
- Rows fading in when they replace the bars: parked as its own issue.
- Measuring how long page data takes, and cutting that time (D1 placement, fewer queries): their own issues. They tune the 150ms.
- Safari's swipe back isn't checked on a device.
