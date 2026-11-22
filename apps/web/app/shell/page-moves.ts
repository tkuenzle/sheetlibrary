import { useEffect, useLayoutEffect, useSyncExternalStore } from "react";
import {
  createContext,
  type RouterContextProvider,
  useLocation,
  useMatches,
} from "react-router";

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
// to a collection is a push that drops. Every page change moves by its kind;
// one that keeps the page, such as a search, doesn't move.

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

// The page's kind, from the pattern of the route it matched, as React
// Router hands it to a middleware, which gets no route ids. React Router
// joins the routes' paths without a leading slash, as "sheets/:id". Agrees
// with `pageKind` for every page (see the unit tests).
const shellPatterns: readonly string[] = [
  "sheets",
  "collections",
  "collections/:id",
  "account",
];

export function patternKind(
  pattern: string,
  params: Record<string, string | undefined>,
): PageKind {
  const path = pattern.replace(/^\/+/, "");
  if (shellPatterns.includes(path)) return { kind: "shell" };
  const sheet = params.id;
  if (sheet === undefined) return null;
  if (path === "sheets/:id") return { kind: "play", sheet };
  if (path === "sheets/:id/edit") return { kind: "edit", sheet };
  return null;
}

// No move (`none`) when `cut` (see `pickMove`).
export function moveKind(from: PageKind, to: PageKind, cut = false): MoveKind {
  if (cut || !from || !to) return "none";
  if (from.kind === "shell") return to.kind === "shell" ? "fade" : "rise";
  if (to.kind === "shell") return "drop";
  return from.sheet === to.sheet && from.kind !== to.kind ? "mode" : "none";
}

// What the middleware needs to know about the page shown and the target.
export interface MovePage {
  path: string;
  kind: PageKind;
}

// The move for a page change. `browserMoved`: the browser already showed a
// move of its own for this step in the history, as Safari does after a
// swipe back. `late`: the loading bar showed while the new page loaded. A
// change that keeps the page, such as a search, a key or a capo, or a link
// to the page that is open, doesn't move.
export function pickMove(
  shown: MovePage | null,
  target: MovePage,
  { browserMoved, late }: { browserMoved: boolean; late: boolean },
): MoveKind {
  if (!shown || shown.path === target.path) return "none";
  return moveKind(shown.kind, target.kind, browserMoved || late);
}

// The move announced for the next page change, from the page shown to the
// target, until it has played. The page's <ViewTransition> takes its kind
// as its class only in the render that reaches the target, and the titles
// take their shared class while it is announced (see the middleware below).
export interface AnnouncedMove {
  from: string;
  to: string;
  kind: Exclude<MoveKind, "none">;
}

let announced: AnnouncedMove | null = null;
const announcedListeners = new Set<() => void>();

function setAnnounced(move: AnnouncedMove | null) {
  if (announced === move) return;
  announced = move;
  for (const listener of announcedListeners) listener();
}

export function subscribeAnnounced(listener: () => void): () => void {
  announcedListeners.add(listener);
  return () => {
    announcedListeners.delete(listener);
  };
}

export function announcedMove(): AnnouncedMove | null {
  return announced;
}

// An update through useSyncExternalStore renders at once and never in a
// Transition, so React doesn't move for it.
export function useAnnouncedMove(): AnnouncedMove | null {
  return useSyncExternalStore(subscribeAnnounced, announcedMove, () => null);
}

// The class of the page's <ViewTransition> for the page at `pathname`: the
// announced kind in the render that reaches its target, otherwise none. So
// no other commit, such as React Router rendering the wait, can take the
// move.
export function pageMoveClass(
  move: AnnouncedMove | null,
  pathname: string,
): string {
  return move?.to === pathname ? move.kind : "none";
}

// Resolved by <PageMoves /> once the announced move has rendered.
let announceRendered: (() => void) | null = null;
export function noteAnnounceRendered() {
  announceRendered?.();
  announceRendered = null;
}

// Announces a move and waits until it has rendered, or for `limitMs` if
// nothing renders it, as when no React tree runs.
export function announceMove(
  move: AnnouncedMove,
  limitMs: number,
): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      announceRendered = null;
      resolve();
    }, limitMs);
    announceRendered = () => {
      clearTimeout(timer);
      resolve();
    };
    setAnnounced(move);
  });
}

// The page on screen, which <PageMoves /> keeps. On a push, the address
// still names it while the loaders run, but on a step back in the history
// the address has already changed.
let shown: MovePage | null = null;
export function showPage(page: MovePage) {
  shown = page;
}

// The path of the page on screen, or null before the first one has shown.
// A client loader reads it to tell a move to another page from the page
// that is open loading again: on a step back the address has already
// changed when the loaders run, but this still names the page being left.
export function shownPath(): string | null {
  return shown?.path ?? null;
}

// Whether the browser showed its own move for the latest step in the
// history, as Safari does after a swipe back. Read in the capture phase, at
// load, so it is set before React Router's own listener starts the step.
let browserMoved = false;
export function noteStepInHistory(event: { hasUAVisualTransition: boolean }) {
  browserMoved = event.hasUAVisualTransition;
}
if (typeof window !== "undefined") {
  window.addEventListener("popstate", noteStepInHistory, { capture: true });
}

// Whether the loading bar shows, which <PageLoading /> notes as it renders.
// A move starts once the new page's data is there. When the person has
// already seen the wait, a move would only add to it, so the page changes
// at once.
let loadingBarShown = false;
export function noteLoadingBar(shown: boolean) {
  loadingBarShown = shown;
}

function nextTask(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

// What React Router hands a client middleware. It passes the data
// strategy's arguments, whose `unstable_initiator` and
// `unstable_navigationType` its types leave out. Nothing stable tells a
// navigation from a fetcher; the e2e tests in page-moves.spec.ts cover both.
export interface MoveArgs {
  url: URL;
  context: Pick<RouterContextProvider, "set">;
  pattern: string;
  params: Record<string, string | undefined>;
  unstable_initiator?: string;
  unstable_navigationType?: string | null;
}

// Whether the browser already showed its own move for this page change, as
// Safari does after a swipe back. The middleware sets it for each
// navigation, and a page's client loader reads it from its `context`: the
// page then doesn't wait for its data first, so its skeleton replaces the
// old page at once. See openspec/specs/site-layout ("No move on top of the
// browser's").
export const browserMovedContext = createContext<boolean>(false);

// How long the middleware waits for an announced move to render.
export const ANNOUNCE_LIMIT = 500;

// The root's client middleware: picks the move for every page change and
// announces it before React Router renders the new page. See docs/motion.md
// ("Page changes") and this change's design.
//
// - React renders an update made during `popstate` at once, without a
//   move, and React Router finishes a step back within that event when no
//   loader waits on the network. So a step back waits one task first,
//   unless the browser already showed its own move: then the page should
//   change at once, under the browser's picture.
// - After the loaders, it announces the move and waits for that render. The
//   old page's titles then carry their shared class, which React reads from
//   their last render as they leave. React Router renders the new page in
//   the microtasks after this returns, and that render gives the page its
//   class.
export async function pageMovesMiddleware<T>(
  args: MoveArgs,
  next: () => Promise<T>,
): Promise<T> {
  if (args.unstable_initiator !== "navigation") return next();
  setAnnounced(null);
  const back = args.unstable_navigationType === "POP";
  const moved = back && browserMoved;
  browserMoved = false;
  args.context.set(browserMovedContext, moved);
  if (back && !moved) await nextTask();
  const result = await next();
  const late = loadingBarShown;
  const target = {
    path: args.url.pathname,
    kind: patternKind(args.pattern, args.params),
  };
  const kind = pickMove(shown, target, { browserMoved: moved, late });
  if (kind !== "none" && shown) {
    await announceMove(
      { from: shown.path, to: target.path, kind },
      ANNOUNCE_LIMIT,
    );
  }
  return result;
}

// Rendered once, in the root, apart from the pages, so that waiting for a
// page doesn't render them again. Keeps the page shown for the middleware,
// and lets an announced move go once it has played.
export function PageMoves() {
  const { pathname } = useLocation();
  const kind = pageKind(useMatches());
  const kindKey = JSON.stringify(kind);
  const move = useAnnouncedMove();
  useLayoutEffect(() => {
    showPage({ path: pathname, kind: JSON.parse(kindKey) as PageKind });
  }, [pathname, kindKey]);
  useLayoutEffect(() => {
    if (move) noteAnnounceRendered();
  }, [move]);
  // Once the page has changed, the move is forgotten, so that no later
  // commit, such as the page's data showing, plays it again. A passive
  // effect: React runs those once the move has ended.
  useEffect(() => {
    if (move && move.from !== pathname) setAnnounced(null);
  }, [move, pathname]);
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

// The title's move, from the browser's own animation of its group, whose
// first and last keyframes hold the old box and the new box. Its transform
// is a matrix whose last two numbers place the box. Null when the keyframes
// don't say.
export function titleMoveFromKeyframes(
  first: Keyframe,
  last: Keyframe,
): { dx: number; dy: number; sx: number; sy: number } | null {
  const from = keyframeBox(first, first);
  const to = keyframeBox(last, first);
  if (!from || !to?.width || !to.height) return null;
  return titleMoveStart(from, to);
}

// A keyframe's box. Width and height fall back to `other`'s, since React
// leaves them out of a keyframe when they don't change.
function keyframeBox(frame: Keyframe, other: Keyframe): Box | null {
  const width = parseFloat(String(frame.width ?? other.width));
  const height = parseFloat(String(frame.height ?? other.height));
  const transform = String(frame.transform ?? "none");
  const place =
    transform === "none"
      ? [0, 0]
      : /^matrix\(([^)]*)\)$/
          .exec(transform)?.[1]
          ?.split(",")
          .slice(4)
          .map(Number);
  if (place?.length !== 2 || place.some(Number.isNaN)) return null;
  if (Number.isNaN(width) || Number.isNaN(height)) return null;
  const [x = 0, y = 0] = place;
  return { x, y, width, height };
}

// The <ViewTransition> instance React hands `onShare`. Its types only name
// `name`; at run time it also has the pseudo-elements of the move.
interface SharedTitle {
  group: { getAnimations(): Animation[] };
}

// `onShare` of the title's <ViewTransition>. The browser's move of the
// group animates its width and height, on the main thread. Its keyframes
// are swapped for `translate` and `scale` from the same two boxes; adding
// an animation of our own instead runs on the main thread, as the browser
// hasn't attached it yet. React drops unchanged width and height the same
// way. The transform origin is the top left (page-moves.css).
export function moveTitle(instance: unknown, kind: "rise" | "drop"): void {
  const animation = (instance as SharedTitle).group.getAnimations()[0];
  const effect = animation?.effect;
  if (!(effect instanceof KeyframeEffect)) return;
  const frames = effect.getKeyframes();
  const first = frames[0];
  const last = frames.at(-1);
  const start = first && last && titleMoveFromKeyframes(first, last);
  if (!start) return;
  const style = getComputedStyle(document.documentElement);
  effect.setKeyframes([
    {
      translate: `${String(start.dx)}px ${String(start.dy)}px`,
      scale: `${String(start.sx)} ${String(start.sy)}`,
    },
    { translate: "0px 0px", scale: "1 1" },
  ]);
  effect.updateTiming({
    // Back is faster than the rise, as the page's drop.
    duration: durationMs(
      style.getPropertyValue(
        kind === "drop" ? "--motion-short" : "--motion-long",
      ),
    ),
    easing: style.getPropertyValue("--ease-move").trim() || "linear",
  });
}

// A duration token, such as "300ms" or "0s", in milliseconds.
export function durationMs(token: string): number {
  const value = parseFloat(token);
  if (Number.isNaN(value)) return 0;
  return token.trim().endsWith("ms") ? value : value * 1000;
}

// The sheet's title moves between its row and the sheet's heading, through
// a <ViewTransition> name they share. Two boundaries mounted with one name
// make React fail, and Recent and the list on Sheets can show the same
// sheet, so each list names its rows apart. A row's link puts its list in
// the location's state, and the heading takes that list's name.

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

// The name of a row's title in `list`.
export function titleName(list: SheetListName, sheet: string): string {
  return `title-${list}-${sheet}`;
}

// The name of the sheet's heading: the one of the row it was opened from,
// from the location's state, or none for a sheet opened another way.
export function headingTitleName(
  sheet: string,
  state: unknown,
): string | undefined {
  if (state === null || typeof state !== "object") return undefined;
  if (!("openedFrom" in state)) return undefined;
  const from = state.openedFrom;
  return from === "list" || from === "recent"
    ? titleName(from, sheet)
    : undefined;
}
