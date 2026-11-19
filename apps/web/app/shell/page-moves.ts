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

// When the page's move that plays now has finished, or at once when none
// plays. A page whose data arrives during its move shows it then (see
// afterMove in awaited.tsx). The browser gives the running move from the
// moment it starts. A browser without `activeViewTransition` is asked for
// the animations on the move's pseudo-elements instead, which exist only
// once the move plays: data that arrives just before shows in its first
// frames, while the new page is still transparent.
export function moveEnded(): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  const settled = (finished: Promise<unknown>) =>
    finished.then(
      () => undefined,
      () => undefined,
    );
  // Undefined in a browser without it, whatever the DOM types say.
  const move = (document as { activeViewTransition?: ViewTransition | null })
    .activeViewTransition;
  if (move !== undefined) {
    return move ? settled(move.finished) : Promise.resolve();
  }
  const moving = document.getAnimations().filter((animation) => {
    const effect = animation.effect;
    return (
      effect instanceof KeyframeEffect &&
      (effect.pseudoElement?.startsWith("::view-transition") ?? false)
    );
  });
  return settled(Promise.all(moving.map((animation) => animation.finished)));
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
  // The title's box in the old page, measured when the move starts: the row
  // is named by then, and the browser takes its picture right after.
  const titleFrom = useRef<Box | null>(null);
  useLayoutEffect(() => {
    if (!isTransitioning) return;
    titleFrom.current = titleBox();
    const started = waitStarted.current;
    if (started !== null) late.current = isLate(performance.now() - started);
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

  // The title's box in the new page, and from both boxes where its move
  // starts. A passive effect, so it runs after React Router has restored
  // the scroll in a layout effect, and before React Router lets the browser
  // take its picture of the new page.
  const measured = useRef<string | null>(null);
  useEffect(() => {
    if (measured.current === location.key) return;
    measured.current = location.key;
    const from = titleFrom.current;
    const to = from && titleBox();
    titleFrom.current = null;
    const style = document.documentElement.style;
    const start = to && titleMoveStart(from, to);
    for (const [name, value] of Object.entries({
      "--title-dx": start && `${String(start.dx)}px`,
      "--title-dy": start && `${String(start.dy)}px`,
      "--title-sx": start && String(start.sx),
      "--title-sy": start && String(start.sy),
    })) {
      if (value) style.setProperty(name, value);
      else style.removeProperty(name);
    }
  });
  return null;
}

// The title moves by `translate` and `scale` only, which the browser runs
// off the main thread. Its own move animates the box's width and height,
// which it can't. The box keeps its size and place in the new page; the
// move starts it scaled and shifted onto its box in the old page. `scale`
// and `translate` apply on top of the browser's own `transform`, which puts
// the box in its place, so with the origin at the top left a point at x
// lands at dx + sx * x.

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function titleMoveStart(
  from: Box,
  to: Box,
): { dx: number; dy: number; sx: number; sy: number } {
  const sx = from.width / to.width;
  const sy = from.height / to.height;
  return { dx: from.x - sx * to.x, dy: from.y - sy * to.y, sx, sy };
}

// The element that has the title's name on the page now.
function titleBox(): Box | null {
  const named = document.querySelector(
    `[style*="view-transition-name: ${TITLE_NAME}"]`,
  );
  return named ? named.getBoundingClientRect() : null;
}

// The sheet's title moves between its row and the sheet's heading. The
// browser moves the element named `sheet-title` in the old page to the one
// in the new page. A name must be on one element per page, or the browser
// skips the whole move, and Recent and the list on Sheets can show the same
// sheet. So a row's link puts its list in the location's state, and only
// the row in that list takes the name, going in and coming back.

const TITLE_NAME = "sheet-title";

export type SheetListName = "list" | "recent";

// The location's state for a row's link. It also carries the row's title
// and artist, so the sheet can show them while the rest of it loads (see
// openspec/specs/site-layout, "What the skeleton already knows").
export function openedFrom(
  list: SheetListName,
  sheet: { title: string; artist?: string },
) {
  return {
    openedFrom: list,
    title: sheet.title,
    ...(sheet.artist ? { artist: sheet.artist } : {}),
  };
}

// The title and artist a row's link left in the location's state, or null
// for a sheet opened another way.
export function rowDetails(
  state: unknown,
): { title: string; artist?: string } | null {
  if (state === null || typeof state !== "object") return null;
  if (!("title" in state) || typeof state.title !== "string") return null;
  const artist =
    "artist" in state && typeof state.artist === "string"
      ? state.artist
      : undefined;
  return artist ? { title: state.title, artist } : { title: state.title };
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
  if (list === null) return TITLE_NAME;
  const state: unknown = sheetEnd.state;
  const from =
    state !== null && typeof state === "object" && "openedFrom" in state
      ? state.openedFrom
      : null;
  return from === list ? TITLE_NAME : undefined;
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
