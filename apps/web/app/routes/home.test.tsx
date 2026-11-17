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
  // Scenario "Opening the home page".
  it("says what the app is for", () => {
    const html = renderToString(<Home />);
    expect(html).toContain("<h1>Every song you play, in one place</h1>");
    expect(html).toContain(
      "Keep your chord sheets in one library. Change the key, add a capo, and play from any screen.",
    );
    expect(html).toContain("Add sheets from photos or from Ultimate Guitar");
    expect(html).toContain("Save a key for each singer");
    expect(html).toContain("Group sheets in collections");
    expect(html).not.toContain("Coming soon");
    // The voice in docs/ui-text.md.
    expect(html).not.toContain("you can");
  });

  it("has the top bar", () => {
    expect(renderToString(<Home />)).toContain('<header class="top-bar">');
  });

  // Requirement "Ways in".
  it("offers to sign in and to try it first", () => {
    const html = renderToString(<Home />);
    expect(html).toMatch(
      /<a class="[^"]*home-way" href="\/sign-in">Sign in<\/a>/,
    );
    expect(html).toMatch(
      /<a class="[^"]*home-way" href="\/editor">Try it first<\/a>/,
    );
  });

  // In one column, the sample comes before the list.
  it("shows the sample with its note, before the list", () => {
    const html = renderToString(<Home />);
    expect(html).toContain("A sample sheet. Try changing the key.");
    expect(html.indexOf('aria-label="Sample sheet"')).toBeLessThan(
      html.indexOf("Add sheets from photos"),
    );
    expect(html.indexOf("Try it first")).toBeLessThan(
      html.indexOf('aria-label="Sample sheet"'),
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
