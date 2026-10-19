import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import Home, { meta } from "./home";

describe("home page", () => {
  it("shows the app name", () => {
    expect(renderToString(<Home />)).toContain("<h1>Sheet Library</h1>");
  });

  it("links to the chord editor prototype", () => {
    expect(renderToString(<Home />)).toContain('href="/spike/editor"');
  });

  it("sets the page title", () => {
    expect(meta()).toContainEqual({ title: "Sheet Library" });
  });
});
