import "./app.css";

import lyricsFont from "@fontsource-variable/schibsted-grotesk/files/schibsted-grotesk-latin-wght-normal.woff2?url";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

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
  return <Outlet />;
}
