import type { ComponentType } from "react";
import { renderToString } from "react-dom/server";
import { createRoutesStub } from "react-router";
import { describe, expect, it } from "vitest";

import { ErrorBoundary as RootError } from "../root";
import { loader, meta, NotFoundView } from "./not-found";

describe("not found", () => {
  // Scenario "A mistyped address".
  it("leads a signed-in person to their sheets", () => {
    const html = renderToString(<NotFoundView signedIn />);
    expect(html).toContain('<h1 class="page-error-title">Page not found</h1>');
    expect(html).toContain(
      "<p>This address doesn’t lead to a page in Sheet Library.</p>",
    );
    expect(html).toMatch(/<a [^>]*href="\/sheets"[^>]*>Go to your sheets<\/a>/);
  });

  // Scenario "Signed out".
  it("leads a visitor to the home page", () => {
    const html = renderToString(<NotFoundView signedIn={false} />);
    expect(html).toMatch(/<a [^>]*href="\/"[^>]*>Go to the home page<\/a>/);
  });

  it("answers with 404, and isn't indexed", () => {
    const response = loader() as unknown as { init: ResponseInit | null };
    expect(response.init?.status).toBe(404);
    expect(meta()).toContainEqual({ name: "robots", content: "noindex" });
  });
});

describe("the root's error boundary", () => {
  function render(error: unknown) {
    const Stub = createRoutesStub([
      {
        id: "root",
        path: "/",
        Component: () => null,
        ErrorBoundary: RootError as ComponentType,
      },
    ]);
    return renderToString(
      <Stub
        initialEntries={["/"]}
        hydrationData={{ errors: { root: error } }}
      />,
    );
  }

  it("shows the site's name and the note, with Try again", () => {
    const html = render(new TypeError("Failed to fetch"));
    expect(html).toMatch(
      /^<header class="top-bar"><a class="top-bar-name" href="\/">Sheet Library<\/a>/,
    );
    expect(html).toContain(
      '<h1 class="page-error-title">Can’t reach Sheet Library</h1>',
    );
    expect(html).toContain("Try again</button>");
  });
});
