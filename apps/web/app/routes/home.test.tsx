import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import Home, { meta } from "./home";

describe("home page", () => {
  it("says what the site is and that it's coming soon", () => {
    const html = renderToString(<Home />);
    expect(html).toContain("<h1>A library for your sheet music</h1>");
    expect(html).toContain("Coming soon.");
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
});
