import { useEffect, useState } from "react";

// How long a wait goes on before the page shows it, in milliseconds, so a
// fast answer doesn't flicker. The loading bar and the search's "Searching…"
// both use it. See openspec/specs/site-layout.
export const SLOW_WAIT = 200;

// How long skeleton bars stay at least once they show, in milliseconds, so
// they never flash. See openspec/specs/site-layout.
export const SKELETON_HOLD = 400;

// How long a move to another page waits for the page's data before the page
// shows with its skeleton, in milliseconds. A fast answer then moves in
// whole. Below SLOW_WAIT, so the loading bar doesn't start while it waits.
// See openspec/specs/site-layout ("A skeleton while a page loads").
export const HEAD_START = 150;

// Starts a wait: calls `show` once it has gone on for `delay`. The returned
// function ends it, cancelling `show`, or calling `hide` if it was shown:
// at once, or once it has shown for `hold`.
export function startWait(
  show: () => void,
  hide: () => void,
  delay = SLOW_WAIT,
  hold = 0,
): () => void {
  let shownAt: number | null = null;
  const timer = setTimeout(() => {
    shownAt = Date.now();
    show();
  }, delay);
  return () => {
    clearTimeout(timer);
    if (shownAt === null) return;
    const left = shownAt + hold - Date.now();
    if (left > 0) setTimeout(hide, left);
    else hide();
  };
}

// Whether `waiting` has been true for more than a moment.
export function useSlowWait(waiting: boolean): boolean {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!waiting) return;
    return startWait(
      () => {
        setSlow(true);
      },
      () => {
        setSlow(false);
      },
    );
  }, [waiting]);
  return slow;
}
