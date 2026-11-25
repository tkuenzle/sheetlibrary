import "./skeleton.css";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { SKELETON_HOLD, SLOW_WAIT, startWait } from "../shell/slow-wait";

// What to show for something that loads where no page move covers it, as in
// a dialog: "waiting" for its first moment, while it keeps its room with
// the bars invisible, so a quick answer shows no bars at all; then "bars",
// which stay for at least SKELETON_HOLD, also after it has loaded, so they
// never flash; then "none", and what loaded shows. See
// openspec/specs/site-layout ("Bars in the dialogs that load").
export function useSkeleton(loading: boolean): "waiting" | "bars" | "none" {
  const [bars, setBars] = useState(false);
  // A load that starts again while the bars are held keeps them. The ref
  // follows in a layout effect, which runs before the effect below cleans
  // up: bars held long enough hide right in that cleanup, and must see that
  // the load has ended.
  const loadingNow = useRef(loading);
  useLayoutEffect(() => {
    loadingNow.current = loading;
  }, [loading]);
  useEffect(() => {
    if (!loading) return;
    return startWait(
      () => {
        setBars(true);
      },
      () => {
        if (!loadingNow.current) setBars(false);
      },
      SLOW_WAIT,
      SKELETON_HOLD,
    );
  }, [loading]);
  if (bars) return "bars";
  return loading ? "waiting" : "none";
}

// Whether useSkeleton()'s bars have shown, so that what replaces them fades
// in (ui/arriving.tsx). A quick answer, whose bars stayed unseen, shows at
// once.
export function useBarsSeen(skeleton: "waiting" | "bars" | "none"): boolean {
  const [seen, setSeen] = useState(false);
  if (skeleton === "bars" && !seen) setSeen(true);
  return seen || skeleton === "bars";
}

// A bar where data is still on its way, inside the real markup of what it
// stands for. It sits in the line like a word, so the line keeps the height
// of the text it stands for, and the row around it keeps its own. `width`
// is in `em`, since a percentage of a box as wide as its text is nothing.
// `accent` is for chords and keys. It pulses, and stands still with reduced
// motion. See openspec/specs/design-system.
// `chip` draws it as tall and round as a chip, such as a sheet's key
// button, with `width` in `em` of the chip's text. `box` draws a tick box,
// as in a dialog's list, and takes no width.
export function Bar({
  width = 1,
  accent = false,
  chip = false,
  box = false,
}: {
  width?: number;
  accent?: boolean;
  chip?: boolean;
  box?: boolean;
}) {
  const className = [
    "skeleton-bar",
    accent && "skeleton-bar-accent",
    chip && "skeleton-bar-chip",
    box && "skeleton-bar-box",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <span
      className={className}
      style={box ? undefined : { width: `${String(width)}em` }}
      aria-hidden="true"
    />
  );
}
