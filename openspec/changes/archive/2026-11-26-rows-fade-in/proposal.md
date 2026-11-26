# Proposal

## Why

Since #168, only a slow page shows bars, and when its data arrives the rows replace the bars at once (#172). Everything else in the app arrives with a short move, so this swap is the one hard cut left in the loading states.

## What Changes

- When a page's data arrives after its bars showed, what replaces the bars fades in. That covers:
  - Sheets: the list's rows and Recent's cards.
  - A collection: its rows, plus its name and count when they were bars.
  - A sheet: its chips and lines, plus its title and artist when they were bars.
  - The account page: its passkey rows.
- On a step back to Sheets, Recent's cards fade in when they replace Recent's bars.
- What already showed for real, such as the heading, the top bar and Sheets' search field, stays as it is.
- The fade plays only once, for the first data after the bars. Rows that show later, such as new search results or the rows after a change, show at once as before. So does a page that arrives whole, and a page shown as it was left on Back.
- The lists in "Add sheets" and "Choose collections" fade in when they replace bars that were seen. A quick list, whose bars stayed unseen, shows at once as before.
- The fade is a CSS animation of `opacity` only, `--motion-short` with linear easing, as Material 3's fade, through a new `--ease-linear` token. It is not a view transition, so taps never wait for it. The bars go at once and the rows fade in from nothing; there is no crossfade.
- With reduced motion, the rows show at once.
- `docs/motion.md`'s "Rows show once the page is in" drops its "for now" and describes the fade.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `site-layout`: data that replaces a page's or a dialog's bars fades in.

## Impact

- `shell/awaited.tsx`: `PageData` tells its content whether it is arriving after bars, and `RecentOnItsWay` in `routes/sheets.tsx` does the same for Recent.
- The parts that stand for bars take a fade class: `sheets/sheet-list.tsx`, `sheets/recent-sheets.tsx`, `routes/collection.tsx`, `routes/sheet.tsx`, `routes/account.tsx`.
- `ui/skeleton.tsx`: `useSkeleton` says when the bars it showed were seen, for `collections/add-sheets-dialog.tsx` and `collections/choose-collections-dialog.tsx`.
- A small stylesheet with the fade's keyframes, on the motion tokens.
- `docs/motion.md`, and e2e tests next to the existing ones in `e2e/loading.spec.ts`.

## Open Questions

- Sheets' search field shows no count while the page loads and then shows it. It isn't a bar; should it fade in with the rows or change at once?
- A collection whose rail knew it had no sheets shows "No sheets yet" with no bars. Nothing fades there; is that fine?
