import { useContext, useEffect, useLayoutEffect, useRef } from "react";
import {
  type Location,
  UNSAFE_ViewTransitionContext as ViewTransitionContext,
  useLocation,
  useMatches,
  useNavigation,
} from "react-router";

import { SLOW_WAIT } from "./slow-wait";

// How a page change moves. See docs/motion.md ("Page changes") and
// openspec/specs/site-layout.
//
//          shell screen --rise--> sheet (play or edit)
//          shell screen <--drop-- sheet
//   shell screen <--fade--> shell screen
//                  play <--mode--> edit, of the same sheet
//
// The kind follows from the two pages, not from the browser's history: React
// Router reports "POP" for back and forward alike, and a link from a sheet
// to a collection is a push that drops. Only links and moves that ask for a
// view transition move at all; the kind only says how.

// Where a page sits.
export type PageKind =
  { kind: "shell" } | { kind: "play" | "edit"; sheet: string } | null;

export type MoveKind = "fade" | "rise" | "drop" | "mode" | "none";

// The page's kind, from the ids of the routes it matched.
export function pageKind(
  matches: { id: string; params: Record<string, string | undefined> }[],
): PageKind {
  const last = matches.at(-1);
  if (!last) return null;
  if (matches.some((match) => match.id === "routes/shell")) {
    return { kind: "shell" };
  }
  const sheet = last.params.id;
  if (sheet === undefined) return null;
  if (last.id === "routes/sheet") return { kind: "play", sheet };
  if (last.id === "routes/sheet.edit") return { kind: "edit", sheet };
  return null;
}

// No move (`none`) when `cut`: the browser already showed a move of its own
// for this step in the history, as Safari does after a swipe back, or the
// new page's data came late (see `isLate`).
export function moveKind(from: PageKind, to: PageKind, cut = false): MoveKind {
  if (cut || !from || !to) return "none";
  if (from.kind === "shell") return to.kind === "shell" ? "fade" : "rise";
  if (to.kind === "shell") return "drop";
  return from.sheet === to.sheet && from.kind !== to.kind ? "mode" : "none";
}

// A move starts once the new page's data is there. When that took longer
// than the loading bar waits before it shows, the person has already
// waited, and a move would only add to it, so the page changes at once.
export function isLate(waitedMs: number): boolean {
  return waitedMs > SLOW_WAIT;
}

// Rendered once, in the root, apart from the pages, so that waiting for a
// page doesn't render them again. Sets `data-move` on <html> on every move,
// so the CSS in page-moves.css knows which move to play; a move to the page
// that is open, such as "Sheet Library" on Sheets, is `none`. It runs in a
// layout effect: React Router renders the new page inside the browser's
// update callback, and the browser styles the move only after that.
export function PageMoves() {
  const location = useLocation();
  const matches = useMatches();
  const waiting = useNavigation().state !== "idle";
  const { isTransitioning } = useContext(ViewTransitionContext);
  const kind = pageKind(matches);
  const shown = useRef<{
    key: string;
    path: string;
    kind: PageKind;
  } | null>(null);
  const browserMoved = useRef(false);
  const waitStarted = useRef<number | null>(null);
  const late = useRef(false);

  useEffect(() => {
    // Fires when the step in the history starts, before React Router has
    // the new page's data and renders it.
    const onPopState = (event: PopStateEvent) => {
      browserMoved.current = event.hasUAVisualTransition;
    };
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  // How long the data took: from the start of the wait to the moment React
  // Router has it and starts the move.
  useLayoutEffect(() => {
    if (waiting) waitStarted.current = performance.now();
  }, [waiting]);
  useLayoutEffect(() => {
    const started = waitStarted.current;
    if (!isTransitioning || started === null) return;
    late.current = isLate(performance.now() - started);
  }, [isTransitioning]);

  useLayoutEffect(() => {
    const last = shown.current;
    if (last?.key === location.key) return;
    shown.current = { key: location.key, path: location.pathname, kind };
    if (!last) return;
    document.documentElement.dataset.move =
      last.path === location.pathname
        ? "none"
        : moveKind(last.kind, kind, browserMoved.current || late.current);
    browserMoved.current = false;
    waitStarted.current = null;
    late.current = false;
  });
  return null;
}

// The sheet's title moves between its row and the sheet's heading. The
// browser moves the element named `sheet-title` in the old page to the one
// in the new page. A name must be on one element per page, or the browser
// skips the whole move, and Recent and the list on Sheets can show the same
// sheet. So a row's link puts its list in the location's state, and only
// the row in that list takes the name, going in and coming back.

export type SheetListName = "list" | "recent";

// The location's state for a row's link.
export function openedFrom(list: SheetListName) {
  return { openedFrom: list };
}

type MoveEnd = Pick<Location, "pathname" | "state">;

// The name for a sheet's title during a move: on a row of `list`, or with
// `list` null on the sheet's heading. None between play and edit, which
// only change the bar.
export function sheetTitleName(
  sheet: string,
  list: SheetListName | null,
  move: { currentLocation: MoveEnd; nextLocation: MoveEnd } | null,
): string | undefined {
  if (!move) return undefined;
  const path = `/sheets/${sheet}`;
  const { currentLocation: current, nextLocation: next } = move;
  const [sheetEnd, otherEnd] =
    current.pathname === path
      ? [current, next]
      : next.pathname === path
        ? [next, current]
        : [null, null];
  if (!sheetEnd || otherEnd.pathname.startsWith(`${path}/`)) return undefined;
  if (list === null) return "sheet-title";
  const state: unknown = sheetEnd.state;
  const from =
    state !== null && typeof state === "object" && "openedFrom" in state
      ? state.openedFrom
      : null;
  return from === list ? "sheet-title" : undefined;
}

// React Router only gives the move's two locations through this unsafe
// context; `useViewTransitionState` says only whether a path takes part. If
// it goes away, the title just doesn't move.
export function useSheetTitleName(
  sheet: string,
  list: SheetListName | null,
): string | undefined {
  const move = useContext(ViewTransitionContext);
  return sheetTitleName(sheet, list, move.isTransitioning ? move : null);
}
