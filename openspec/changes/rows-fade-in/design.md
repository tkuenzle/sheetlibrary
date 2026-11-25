# Design

## Context

A slow page renders `PageData` (`shell/awaited.tsx`) in `<Suspense>`, with the page's skeleton as its fallback. The skeleton is the page's real frame, with bars only where data is still on its way. When the data arrives, React drops the fallback and mounts the content in one commit. Data that arrives during a page move shows once the move has ended. Recent, on a step back to Sheets, has a `<Suspense>` of its own (`RecentOnItsWay`). The dialogs don't use Suspense: `useSkeleton` (`ui/skeleton.tsx`) goes from "waiting" (bars unseen) to "bars" to "none".

## Goals / Non-Goals

**Goals:**
- One way for any part that stood for bars to fade in on its first arrival, that pages and dialogs share.

**Non-Goals:**
- A crossfade from the bars. Suspense removes the fallback without a way to let it leave slowly, short of a view transition.
- Fading anything that didn't show as a bar.

## Decisions

### A CSS fade, not a view transition

The parts fade with a keyframe animation on `opacity`, as they mount. A `<ViewTransition>` around the Suspense would crossfade the whole document instead, and that has two costs. Taps land on the pictures while it runs. Sheets' search field, which works while the page loads, would show what's typed only after the fade. Data arriving is not a move between places, so it shouldn't hold the page.

### "Arriving" is a context that each part reads once, at mount

`PageData` provides an "arriving" context. It is true in the commit where the content replaces the skeleton, and false otherwise: for a page that arrives whole, and from the first effect after the arrival on. Each part that can fade reads it once, when it mounts, and keeps the fade class from then on.

- Rows that mount later, such as new search results or "No results" turning back into a list, read false and show at once.
- A class kept on an element doesn't play its animation again, so later renders change nothing.
- `RecentOnItsWay` provides the same context around Recent's cards.

Alternative: put the class on the list's container and rely on the animation playing only when the container is inserted. That works until a container is swapped out, as a list is for "No results", and the fade then plays again on a search. Rejected.

### Each page decides what was a bar with its skeleton's own check

The heading of a collection is a bar only when the rail didn't know the collection. A sheet's title and artist are bars only without the row it was opened from. The loaded page uses the same check as its skeleton (`listed`, `rowDetails(location.state)`) to choose whether those parts take the fade. Rows, Recent's cards, a sheet's chips and lines, and the passkey rows always stood for bars, so they always take it when arriving.

### Dialogs use a hook next to `useSkeleton`

The dialogs know their bars were seen when `useSkeleton` reached "bars". A small hook remembers that and answers "arriving" in the render where the state becomes "none". The rows read it once at mount, as on a page. A quick list, which never reached "bars", shows at once.

### Timing and reduced motion

One keyframe, `opacity` from 0 to 1, over `--motion-short` with `--ease-enter`, in a stylesheet next to the skeleton's. With reduced motion the token is 0s, so the animation ends at once and needs no rule of its own (`docs/motion.md`, "Reduced motion").

## Risks / Trade-offs

- [The bars vanish and the area is empty for a moment before the rows fade up] → At 150ms the dip is short. A crossfade would need the skeleton to stay mounted over the content, against how Suspense works.
- [A part forgets to take the fade, or takes it when it showed for real] → e2e tests check the animations on a slow collection, a slow sheet and Back to Sheets, and that the heading has none.
- [A sheet opened from a link fades its title while it is inside `TitleMove`] → The title takes part in a view transition only while a rise or drop is announced, and the data shows after the move has ended, so the two never overlap.
