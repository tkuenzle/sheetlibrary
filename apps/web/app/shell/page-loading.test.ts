import { describe, expect, it } from "vitest";

import { isPageLoad } from "./page-loading";

// How long the bar waits before it shows is tested in slow-wait.test.ts.
describe("isPageLoad", () => {
  const sheets = { pathname: "/sheets", search: "" };
  const to = (pathname: string, search = "") => ({
    pathname,
    search,
    hash: "",
    state: null,
    key: "next",
  });

  it("is false when nothing loads", () => {
    expect(
      isPageLoad(
        { state: "idle", location: undefined, formMethod: undefined },
        sheets,
      ),
    ).toBe(false);
  });

  it("is true for a move to another page", () => {
    expect(
      isPageLoad(
        {
          state: "loading",
          location: to("/collections"),
          formMethod: undefined,
        },
        sheets,
      ),
    ).toBe(true);
  });

  it("is true for a form that submits", () => {
    expect(
      isPageLoad(
        { state: "submitting", location: to("/sheets"), formMethod: "POST" },
        sheets,
      ),
    ).toBe(true);
  });

  it("is false for a search", () => {
    expect(
      isPageLoad(
        {
          state: "loading",
          location: to("/sheets", "?q=grace"),
          formMethod: undefined,
        },
        sheets,
      ),
    ).toBe(false);
  });

  it("is true when the same address loads again, as after Try again", () => {
    expect(
      isPageLoad(
        { state: "loading", location: to("/sheets"), formMethod: undefined },
        sheets,
      ),
    ).toBe(true);
  });
});
