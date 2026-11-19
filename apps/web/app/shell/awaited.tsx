import { type ReactNode, Suspense, useEffect, useState } from "react";
import { Await, useAsyncError, useNavigate } from "react-router";

// For the pages whose data comes after the page, in <Await> with a
// skeleton (see openspec/specs/site-layout). A move to such a page doesn't
// wait for its data, so what the server answers arrives here.

// Whether a client loader runs for a move from another page, which shows a
// skeleton, rather than for the page that is open loading again: a search,
// a change on one of its rows, or "Try again". Those wait for their data
// as before, so the page keeps what it shows and React Router's navigation
// says it is loading, as a search's "Searching…" needs. The address
// changes only after the loaders, so it still names the page that is open.
export function fromAnotherPage(url: URL): boolean {
  return (
    typeof window === "undefined" || window.location.pathname !== url.pathname
  );
}

// The page's data for a client loader to hand over unawaited, once it has
// arrived and the page's move has ended. Rows that arrive while the page
// still moves in wait, so they don't swap in mid-move. Without a move, as
// when a page loads again or with reduced motion, nothing waits. Data that
// arrives before the move has started goes into its picture, so the page
// moves in whole.
export async function afterMove<T>(data: Promise<T>): Promise<T> {
  const value = await data;
  await moveEnded();
  return value;
}

// When the view transition that plays now, if any, has finished: its
// animations run on the `::view-transition` pseudo-elements.
function moveEnded(): Promise<unknown> {
  if (typeof document === "undefined") return Promise.resolve();
  const moving = document.getAnimations().filter((animation) => {
    const effect = animation.effect;
    return (
      effect instanceof KeyframeEffect &&
      (effect.pseudoElement?.startsWith("::view-transition") ?? false)
    );
  });
  return Promise.all(
    moving.map((animation) => animation.finished.catch(() => undefined)),
  );
}

// A page's data, whole or on its way. On its way, after a move, it renders
// in <Suspense> with the page's skeleton until it is there. Whole, as on a
// first load, it renders at once, without a <Suspense>: React's server
// sends a large <Suspense> apart, skeleton first, and a first load comes
// whole. The choice is kept while the page stays, so that its parts keep
// their state, such as a search field's focus, as the page loads again.
// Key it by what the page shows, so another collection or sheet chooses
// anew.
export function PageData<T>({
  data,
  skeleton,
  children,
}: {
  data: T | Promise<T>;
  skeleton: ReactNode;
  children: (data: T) => ReactNode;
}) {
  const [streamed] = useState(() => data instanceof Promise);
  if (!streamed && !(data instanceof Promise)) return children(data);
  return (
    <Suspense fallback={skeleton}>
      <Await resolve={data} errorElement={<AwaitError />}>
        {children}
      </Await>
    </Suspense>
  );
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
