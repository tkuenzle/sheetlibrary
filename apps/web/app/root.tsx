import "./app.css";
import "./shell/page-moves.css";

import lyricsFont from "@fontsource-variable/schibsted-grotesk/files/schibsted-grotesk-latin-wght-normal.woff2?url";
import { ViewTransition } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  type ShouldRevalidateFunctionArgs,
  useLoaderData,
  useLocation,
} from "react-router";

import type { Route } from "./+types/root";
import { getAuth } from "./auth/auth.server";
import { cloudflareContext, sessionContext } from "./context";
import { NotFoundView } from "./routes/not-found";
import { useFocusOnNavigation } from "./shell/focus";
import { PageLoading } from "./shell/page-loading";
import {
  type MoveArgs,
  PageMoves,
  pageMoveClass,
  pageMovesMiddleware,
  useAnnouncedMove,
} from "./shell/page-moves";
import { revalidateAfterChanges } from "./shell/revalidate";
import { initialOf, SignedInContext } from "./shell/signed-in";
import { TopBar } from "./shell/top-bar";
import { Button } from "./ui/button";
import { errorKind, isOnline, PageError } from "./ui/page-error";

// The font is served from our own origin (see docs/design-direction.md). The
// latin file holds every weight, so preloading it covers the lyrics and the
// chords, which the editor measures.
export function links() {
  return [
    {
      rel: "preload",
      href: lyricsFont,
      as: "font",
      type: "font/woff2",
      crossOrigin: "anonymous",
    },
  ];
}

// Picks how each page change moves, in the browser. See shell/page-moves.ts.
export const clientMiddleware: Route.ClientMiddlewareFunction[] = [
  (args, next) => pageMovesMiddleware(args as typeof args & MoveArgs, next),
];

// Reads who is signed in once per request, for every loader and action.
export const middleware: Route.MiddlewareFunction[] = [
  async ({ request, context }) => {
    const { env } = context.get(cloudflareContext);
    const session = await getAuth(env, request).api.getSession({
      headers: request.headers,
    });
    context.set(sessionContext, session);
  },
];

export function loader({ context }: Route.LoaderArgs) {
  const session = context.get(sessionContext);
  return {
    signedIn: session ? { initial: initialOf(session.user.email) } : null,
  };
}

// Who is signed in only changes with a full load: signing in opens a link,
// and signing out loads the home page. See shell/revalidate.ts.
export function shouldRevalidate(args: ShouldRevalidateFunctionArgs) {
  return revalidateAfterChanges(args);
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        {/* On Android, the page shrinks for the keyboard, so the editor's
            docked toolbar sits above it. iOS ignores this. */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, interactive-widget=resizes-content"
        />
        <Meta />
        {/* The order of the cascade layers, before any stylesheet. All CSS
            is one file, and the bundler decides the order of its rules, so
            each CSS file puts its rules in a layer instead. The first
            statement the browser sees fixes the order. See
            docs/design-direction.md. */}
        <style>{"@layer tokens, base, editor, components, pages;"}</style>
        <Links />
      </head>
      <body>
        <PageLoading />
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

// The last resort, for an error no route closer to it catches, such as the
// root's own loader failing. The app may be what broke, so "Try again"
// loads the page in full, and nothing here reads the root's data: the top
// bar shows only the site's name. See openspec/specs/site-layout.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  if (notFound) return <NotFoundView signedIn={false} />;
  return (
    <>
      <TopBar />
      <main>
        <PageError kind={errorKind(error, isOnline())}>
          <Button
            icon="refresh"
            onClick={() => {
              window.location.reload();
            }}
          >
            Try again
          </Button>
        </PageError>
      </main>
    </>
  );
}

export default function App() {
  const { signedIn } = useLoaderData<typeof loader>();
  const { pathname } = useLocation();
  const move = useAnnouncedMove();
  useFocusOnNavigation();
  return (
    <SignedInContext value={signedIn}>
      <PageMoves />
      {/* The page is the one picture of a page change, as the root was for
          the browser's own moves; the announced kind of move is its class in
          the render that changes the page. See shell/page-moves.css. */}
      <ViewTransition default="none" update={pageMoveClass(move, pathname)}>
        <div className="page-moves-page">
          <Outlet />
        </div>
      </ViewTransition>
    </SignedInContext>
  );
}
