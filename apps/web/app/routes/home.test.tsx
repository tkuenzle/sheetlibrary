import { renderToString } from "react-dom/server";
import { RouterContextProvider } from "react-router";
import { describe, expect, it } from "vitest";

import { sessionContext } from "../context";
import type { Route } from "./+types/home";
import Home, { loader, meta } from "./home";

function load(signedIn: boolean) {
  const context = new RouterContextProvider();
  context.set(sessionContext, signedIn ? ({} as never) : null);
  return loader({ context } as unknown as Route.LoaderArgs);
}

describe("home page", () => {
  it("says what the site is and that it's coming soon", () => {
    const html = renderToString(<Home />);
    expect(html).toContain("<h1>A library for your sheet music</h1>");
    expect(html).toContain("Coming soon.");
    // The voice in docs/ui-text.md.
    expect(html).not.toContain("you can");
  });

  it("has the top bar", () => {
    expect(renderToString(<Home />)).toContain('<header class="top-bar">');
  });

  it("links to the chord editor", () => {
    expect(renderToString(<Home />)).toMatch(
      /<a class="[^"]*" href="\/editor">Try the chord editor<\/a>/,
    );
  });

  it("sets the page title", () => {
    expect(meta()).toContainEqual({ title: "Sheet Library" });
  });

  // Scenario "Signed in".
  it("sends signed-in people to the library", () => {
    const response = load(true);
    expect(response?.status).toBe(302);
    expect(response?.headers.get("Location")).toBe("/sheets");
  });

  it("shows the home page to visitors", () => {
    expect(load(false)).toBeNull();
  });
});
