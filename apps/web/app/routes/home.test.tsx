import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import Home, { meta } from "./home";

describe("home page", () => {
  it("shows the app name", () => {
    expect(renderToString(<Home />)).toContain("<h1>Sheet Library</h1>");
  });

  it("sets the page title", () => {
    expect(meta()).toContainEqual({ title: "Sheet Library" });
  });
});
