import { type KeyboardEvent, type RefObject, useEffect, useState } from "react";

// How an overlay leaves (see docs/motion.md): it is marked `data-closing`,
// its CSS plays the exit, and it closes once that is done. While it leaves
// it is inert, so it takes no taps or keys.

// Resolves once the animations on the element and inside it have finished.
// At once when there are none, as with reduced motion, where they take 0s,
// or in a browser without the API. Animations that repeat forever, such as
// the photo import's sign, are not waited for.
export function exitFinished(element: Element): Promise<void> {
  if (typeof element.getAnimations !== "function") return Promise.resolve();
  const animations = element
    .getAnimations({ subtree: true })
    .filter(
      (animation) =>
        animation.effect?.getComputedTiming().iterations !== Infinity,
    );
  return Promise.allSettled(
    animations.map((animation) => animation.finished),
  ).then(() => undefined);
}

// The exit each dialog is playing, so one that was cut short doesn't close
// the dialog after it opened again.
const exits = new WeakMap<HTMLDialogElement, object>();

// Plays a dialog's exit, then closes it. Does nothing while it is closed or
// already leaving, so a second Cancel is ignored. Its `close` event, where
// the caller tidies up, fires once it has closed. If something else closes it
// first, such as Android's back, the marks go with that close, so the dialog
// opens normally the next time.
export function closeAfterExit(dialog: HTMLDialogElement | null): void {
  if (!dialog?.open || dialog.hasAttribute("data-closing")) return;
  const unmark = () => {
    dialog.removeAttribute("data-closing");
    dialog.inert = false;
  };
  dialog.setAttribute("data-closing", "");
  dialog.inert = true;
  const exit = {};
  exits.set(dialog, exit);
  dialog.addEventListener("close", unmark, { once: true });
  void exitFinished(dialog).then(() => {
    if (exits.get(dialog) !== exit || !dialog.hasAttribute("data-closing")) {
      return;
    }
    unmark();
    dialog.close();
  });
}

// Stops the exit a dialog is playing, if it is, and keeps it open: it comes
// in again. Says whether it did. For a button that opens the dialog again
// while it leaves.
export function stopExit(dialog: HTMLDialogElement | null): boolean {
  if (!dialog?.hasAttribute("data-closing")) return false;
  exits.delete(dialog);
  dialog.removeAttribute("data-closing");
  dialog.inert = false;
  return true;
}

// A dialog's onKeyDown: Escape plays the exit instead of closing it at once.
// It is caught at keydown, since the browser closes a dialog on its own
// `cancel` and only lets that be stopped once in a row. Something inside that
// already handled Escape, by preventing its default, keeps it.
export function exitOnEscape(event: KeyboardEvent<HTMLDialogElement>): void {
  if (event.key !== "Escape" || event.defaultPrevented) return;
  event.preventDefault();
  closeAfterExit(event.currentTarget);
}

// For something rendered only while open, such as a menu's list. `value` is
// what is open, or null. When it turns null, `shown` keeps the last value and
// `closing` is true until the animations in `element` have finished, so the
// caller can render it with `data-closing` and `inert` while its exit plays.
export function usePresence<T>(
  value: T | null,
  element: RefObject<Element | null>,
): { shown: T | null; closing: boolean } {
  const [last, setLast] = useState(value);
  const [leaving, setLeaving] = useState<T | null>(null);

  // Set while rendering, so the exit starts in the same frame the value goes.
  if (value !== last) {
    setLast(value);
    setLeaving(value === null ? last : null);
  }

  useEffect(() => {
    if (leaving === null) return;
    const node = element.current;
    if (!node) {
      setLeaving(null);
      return;
    }
    let cancelled = false;
    void exitFinished(node).then(() => {
      if (!cancelled) setLeaving(null);
    });
    return () => {
      cancelled = true;
    };
  }, [leaving, element]);

  return {
    shown: value ?? leaving,
    closing: value === null && leaving !== null,
  };
}
