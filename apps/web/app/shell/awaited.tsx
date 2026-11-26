import {
  type ReactNode,
  Suspense,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import {
  Await,
  type RouterContextProvider,
  useAsyncError,
  useNavigate,
} from "react-router";

import { Arriving } from "../ui/arriving";
import { addressOf, type KeptPages, useKeep } from "./kept";
import {
  browserMovedContext,
  historyStepContext,
  pageLoadStartedAt,
  shownPath,
} from "./page-moves";
import { HEAD_START, SKELETON_HOLD } from "./slow-wait";

// For the pages whose data can come after the page, in <Await> with a
// skeleton (see openspec/specs/site-layout). A move to such a page waits
// only a moment for its data, so what the server answers may arrive here.

// Whether a client loader runs for a move from another page, which may show
// a skeleton, rather than for the page that is open loading again: a search,
// a change on one of its rows, or "Try again". Those wait for their data as
// before, so the page keeps what it shows and React Router's navigation says
// it is loading, as a search's "Searching…" needs. It compares with the page
// on screen, not the address, which a step back in the history has already
// changed when the loaders run.
export function fromAnotherPage(
  url: URL,
  onScreen: string | null = shownPath(),
): boolean {
  return onScreen !== url.pathname;
}

// The page's data for a client loader, after waiting up to `waitMs` for it:
// whole when it arrived in that time, so the page moves in without a
// skeleton, or else still on its way, for PageData to show with its
// skeleton. React Router keeps the page that is open on screen while the
// loader waits. A failure in that time throws, as in a loader that waits for
// its data, so the route's ErrorBoundary shows it.
//
// Data handed over on its way is held until `holdMs` after the page's
// skeleton has shown, so its bars never blink. React would show it as soon
// as the page has moved in, which without a move is at once. The skeleton
// can show well after the handover, as when the page waits for its
// stylesheet, so the hold counts from when it shows (noteSkeletonShown). A
// failure goes on at once. See openspec/specs/site-layout ("A skeleton while
// a page loads", "Bars never blink").
export async function headStart<T>(
  data: Promise<T>,
  waitMs: number,
  holdMs = 0,
): Promise<{ page: T | Promise<T> }> {
  if (waitMs > 0) {
    const late = Symbol("late");
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeUp = new Promise<typeof late>((resolve) => {
      timer = setTimeout(() => {
        resolve(late);
      }, waitMs);
    });
    try {
      const first = await Promise.race([data, timeUp]);
      if (first !== late) return { page: first as T };
    } finally {
      clearTimeout(timer);
    }
  }
  return { page: holdMs > 0 ? holdBars(data, holdMs) : data };
}

// How long held data waits at most for its skeleton to show, in case the
// page never shows it.
const SHOWN_LIMIT = 5000;

// Called when the skeleton of the latest data handed over has shown.
let skeletonShown: ((at: number) => void) | null = null;

// Notes that the page's skeleton has shown, from a layout effect in it: its
// bars are on screen from this commit on.
export function noteSkeletonShown() {
  skeletonShown?.(Date.now());
  skeletonShown = null;
}

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

async function holdBars<T>(data: Promise<T>, holdMs: number): Promise<T> {
  const shown = new Promise<number>((resolve) => {
    skeletonShown = resolve;
    setTimeout(() => {
      resolve(Date.now() - holdMs);
    }, SHOWN_LIMIT);
  });
  const value = await data;
  const left = (await shown) + holdMs - Date.now();
  if (left > 0) await sleep(left);
  return value;
}

// How long a page's client loader still waits for its data: what is left of
// HEAD_START since the page load started. What React Router did before the
// loader, such as fetching `/__manifest` or the route's code, counts, so the
// wait never pushes a page past the loading bar on its own. Without a start
// yet, the loader runs at about the start, and waits it all.
export function waitLeft(startedAt: number | null, now: number): number {
  if (startedAt === null) return HEAD_START;
  return Math.min(HEAD_START, Math.max(0, HEAD_START - (now - startedAt)));
}

// headStart() for a page's client loader on a move from another page: it
// waits what is left of HEAD_START, or not at all after the browser's own
// move, as Safari's swipe back, so the page's skeleton replaces the old page
// at once. Bars are held SKELETON_HOLD, as in the dialogs.
export function handOver<T>(
  data: Promise<T>,
  context: Pick<RouterContextProvider, "get">,
): Promise<{ page: T | Promise<T> }> {
  return headStart(data, moveWait(context), SKELETON_HOLD);
}

// How long a page's client loader waits for its data on this move.
function moveWait(context: Pick<RouterContextProvider, "get">): number {
  return context.get(browserMovedContext)
    ? 0
    : waitLeft(pageLoadStartedAt(), Date.now());
}

// The page as it was left, with one part still on its way.
export type WithLatePart<T, K extends keyof T> = Omit<T, K> & {
  [P in K]: T[P] | Promise<T[P]>;
};

// handOver() for a step back to a page kept for it whose part `late` the
// page left behind may have changed since, as opening a sheet changes
// Sheets' Recent. The page waits for its fresh data as on any other move,
// and arrives whole if it comes in time. Otherwise it shows as it was left,
// at once after the browser's own move, with `late` on its way from the
// fresh data, its bars held SKELETON_HOLD. When the fresh data fails, the
// page keeps what it showed. See openspec/specs/site-layout ("Back to
// Sheets").
export async function handOverBack<T, K extends keyof T>(
  back: { kept: T; fresh: Promise<T> },
  late: K,
  context: Pick<RouterContextProvider, "get">,
): Promise<{ page: T | WithLatePart<T, K> }> {
  const fresh = back.fresh.catch(() => back.kept);
  const first = await headStart(fresh, moveWait(context));
  if (!(first.page instanceof Promise)) return { page: first.page };
  const part = await headStart(
    fresh.then((data) => data[late]),
    0,
    SKELETON_HOLD,
  );
  return { page: { ...back.kept, [late]: part.page } };
}

// For a page's client loader on a step back or forward in the history: the
// page as it was left, if it was kept, and a fresh request started for the
// load that follows in the background (shell/kept.ts). Null otherwise, for
// the page to load as on any other move. See openspec/specs/site-layout
// ("Back shows the page as it was left").
export function backAsLeft<T>(
  kept: KeptPages<T>,
  url: URL,
  context: Pick<RouterContextProvider, "get">,
  request: () => Promise<T>,
): { page: T } | null {
  if (!context.get(historyStepContext)) return null;
  const back = kept.step(addressOf(url), request);
  return back && { page: back.kept };
}

// A page's data, whole or on its way. On its way, after a move whose data
// didn't come in time, it renders in <Suspense> with the page's skeleton,
// from the start, until it is there. Whole, as on a first load, it renders
// at once, without a <Suspense>: React's server sends a large <Suspense>
// apart, skeleton first, and a first load comes whole. The choice is kept
// while the page stays, so that its parts keep their state, such as a
// search field's focus, as the page loads again. Key it by what the page
// shows, so another collection or sheet chooses anew.
//
// With `kept`, it keeps the data once it is whole, for a step back to the
// page (shell/kept.ts).
//
// Data that replaces the skeleton is arriving (ui/arriving.tsx), so the
// parts that stood for bars fade in. Whole data shows at once.
export function PageData<T>({
  data,
  skeleton,
  kept,
  children,
}: {
  data: T | Promise<T>;
  skeleton: ReactNode;
  kept?: KeptPages<T>;
  children: (data: T) => ReactNode;
}) {
  const [streamed] = useState(() => data instanceof Promise);
  const render = (whole: T) => (
    <>
      {kept && <Keep kept={kept} data={whole} />}
      {children(whole)}
    </>
  );
  if (!streamed && !(data instanceof Promise)) return render(data);
  return (
    <Suspense
      fallback={
        <>
          {skeleton}
          <SkeletonShown />
        </>
      }
    >
      <Await resolve={data} errorElement={<AwaitError />}>
        {(whole) => <Arriving>{render(whole)}</Arriving>}
      </Await>
    </Suspense>
  );
}

function Keep<T>({ kept, data }: { kept: KeptPages<T>; data: T }) {
  useKeep(kept, data);
  return null;
}

// Marks when a page's skeleton shows, for the data held for it (headStart).
// Render it beside the bars in a <Suspense> fallback.
export function SkeletonShown() {
  useLayoutEffect(() => {
    noteSkeletonShown();
  }, []);
  return null;
}

// Where a failed load leads, when the server answered with a redirect, as
// it does when the person isn't signed in any more.
export function redirectTarget(error: unknown): string | null {
  if (!(error instanceof Response)) return null;
  if (error.status < 300 || error.status >= 400) return null;
  return error.headers.get("Location");
}

// <Await>'s errorElement: it follows a redirect, and hands any other error
// to the route's ErrorBoundary, so the note shows inside the frame as for a
// page that waited for its data.
export function AwaitError() {
  const error = useAsyncError();
  const navigate = useNavigate();
  const target = redirectTarget(error);
  useEffect(() => {
    if (target !== null) void navigate(target, { replace: true });
  }, [navigate, target]);
  if (target !== null) return null;
  throw error;
}
