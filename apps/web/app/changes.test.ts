import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { sendChange } from "./changes";
import { forgetKept, KeptPages } from "./shell/kept";

describe("sendChange", () => {
  const pages = new KeptPages<string>();

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response(null, { status: 204 }))),
    );
    pages.keep("/sheets", "kept");
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    forgetKept();
  });

  it("forgets the kept pages before it sends a change", async () => {
    let atSend: string | undefined = "unset";
    vi.mocked(fetch).mockImplementation(() => {
      atSend = pages.get("/sheets");
      return Promise.resolve(new Response(null, { status: 204 }));
    });
    await sendChange("/api/sheets/a", { method: "PUT", body: "{}" });
    expect(atSend).toBeUndefined();
  });

  it("keeps them for a request that only reads", async () => {
    await sendChange("/api/sheets/a/collections");
    await sendChange("/api/sheets/a/collections", { method: "GET" });
    expect(pages.get("/sheets")).toBe("kept");
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

// Requirement "A change forgets what Back shows": a change sent with a plain
// `fetch` anywhere else would leave old pages for Back.
describe("the app's requests", () => {
  const sources = import.meta.glob<string>("./**/*.{ts,tsx}", {
    query: "?raw",
    import: "default",
    eager: true,
  });

  it("go through sendChange in the browser", () => {
    const callers = Object.entries(sources)
      .filter(
        ([path]) => !/\.test\.tsx?$|\.server\.ts$|^\.\/changes\.ts$/.test(path),
      )
      .filter(([, text]) => /(^|[^\w.])fetch\(/m.test(text))
      .map(([path]) => path);
    expect(callers).toEqual([]);
  });
});
