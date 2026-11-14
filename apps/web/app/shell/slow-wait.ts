import { useEffect, useState } from "react";

// How long a wait goes on before the page shows it, in milliseconds, so a
// fast answer doesn't flicker. The loading bar and the search's "Searching…"
// both use it. See openspec/specs/site-layout.
export const SLOW_WAIT = 200;

// Starts a wait: calls `show` once it has gone on for `delay`. The returned
// function ends it, cancelling `show`, or calling `hide` if it was shown.
export function startWait(
  show: () => void,
  hide: () => void,
  delay = SLOW_WAIT,
): () => void {
  let shown = false;
  const timer = setTimeout(() => {
    shown = true;
    show();
  }, delay);
  return () => {
    clearTimeout(timer);
    if (shown) hide();
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
