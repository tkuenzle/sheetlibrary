import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { errorKind, PageError } from "./page-error";

describe("errorKind", () => {
  it("can't reach the server when a fetch got no answer", () => {
    expect(errorKind(new TypeError("Failed to fetch"), true)).toBe(
      "unreachable",
    );
    expect(errorKind(new TypeError("Load failed"), true)).toBe("unreachable");
  });

  it("can't reach the server when the browser is offline", () => {
    expect(errorKind(new Error("Unexpected Server Error"), false)).toBe(
      "unreachable",
    );
  });

  it("went wrong on a 500 or a bug", () => {
    expect(errorKind(new Error("Unexpected Server Error"), true)).toBe(
      "failed",
    );
    expect(
      errorKind(new TypeError("Cannot read properties of undefined"), true),
    ).toBe("failed");
  });
});

describe("PageError", () => {
  it("says the server can't be reached, with the action", () => {
    const html = renderToString(
      <PageError kind="unreachable">
        <button type="button">Try again</button>
      </PageError>,
    );
    expect(html).toContain(
      '<h1 class="page-error-title">Can’t reach Sheet Library</h1>',
    );
    expect(html).toContain("<p>Check your connection and try again.</p>");
    expect(html).toContain("Try again</button>");
  });

  it("says something went wrong, without a line", () => {
    const html = renderToString(
      <PageError kind="failed">
        <button type="button">Try again</button>
      </PageError>,
    );
    expect(html).toContain(
      '<h1 class="page-error-title">Something went wrong</h1>',
    );
    expect(html).not.toContain("<p>");
  });
});
