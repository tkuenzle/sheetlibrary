import "./app.css";

import lyricsFont from "@fontsource-variable/schibsted-grotesk/files/schibsted-grotesk-latin-wght-normal.woff2?url";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "react-router";

import type { Route } from "./+types/root";
import { getAuth } from "./auth/auth.server";
import { cloudflareContext, sessionContext } from "./context";
import { SignedInContext } from "./shell/signed-in";

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
  return { signedIn: context.get(sessionContext) !== null };
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
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { signedIn } = useLoaderData<typeof loader>();
  return (
    <SignedInContext value={signedIn}>
      <Outlet />
    </SignedInContext>
  );
}
