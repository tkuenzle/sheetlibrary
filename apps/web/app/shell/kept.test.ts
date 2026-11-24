import { afterEach, describe, expect, it, vi } from "vitest";

import {
  addressOf,
  dropHeld,
  forgetKept,
  isLoadingKeptAgain,
  KEPT_LIMIT,
  keptMiddleware,
  KeptPages,
  loadsKeptAgain,
  takeLoadDue,
} from "./kept";

afterEach(() => {
  forgetKept();
});

describe("KeptPages", () => {
  it("keeps the last 10 addresses, the oldest dropped first", () => {
    const pages = new KeptPages<number>();
    for (let i = 0; i <= KEPT_LIMIT; i++)
      pages.keep(`/collections/${String(i)}`, i);
    expect(pages.get("/collections/0")).toBeUndefined();
    expect(pages.get("/collections/1")).toBe(1);
    expect(pages.get(`/collections/${String(KEPT_LIMIT)}`)).toBe(KEPT_LIMIT);
  });

  it("counts a page kept again as the newest", () => {
    const pages = new KeptPages<string>(2);
    pages.keep("/a", "a");
    pages.keep("/b", "b");
    pages.keep("/a", "a again");
    pages.keep("/c", "c");
    expect(pages.get("/a")).toBe("a again");
    expect(pages.get("/b")).toBeUndefined();
  });

  it("keeps a search apart from the list", () => {
    const pages = new KeptPages<string>();
    pages.keep(addressOf(new URL("http://x/sheets")), "list");
    pages.keep(addressOf(new URL("http://x/sheets?q=grace")), "results");
    expect(pages.get("/sheets")).toBe("list");
    expect(pages.get("/sheets?q=grace")).toBe("results");
  });

  it("gives nothing for a step to a page not kept, and asks nothing", () => {
    const pages = new KeptPages<string>();
    const request = vi.fn(() => Promise.resolve("fresh"));
    expect(pages.step("/a", request)).toBeNull();
    expect(request).not.toHaveBeenCalled();
    expect(takeLoadDue()).toBe(false);
  });

  it("gives the kept data on a step, and the background load the request it started", async () => {
    const pages = new KeptPages<string>();
    pages.keep("/a", "kept");
    const request = vi.fn(() => Promise.resolve("fresh"));
    const back = pages.step("/a", request);
    expect(back?.kept).toBe("kept");
    expect(takeLoadDue()).toBe(true);
    expect(takeLoadDue()).toBe(false);
    expect(await pages.again("/a", request)).toBe("fresh");
    expect(request).toHaveBeenCalledTimes(1);
    // A later load asks again.
    expect(await pages.again("/a", request)).toBe("fresh");
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("gives back the kept data when the background load fails", async () => {
    const pages = new KeptPages<string>();
    pages.keep("/a", "kept");
    pages.step("/a", () => Promise.reject(new Error("offline")));
    expect(await pages.again("/a", () => Promise.resolve("fresh"))).toBe(
      "kept",
    );
  });

  it("lets any other load fail as before", async () => {
    const pages = new KeptPages<string>();
    pages.keep("/a", "kept");
    await expect(
      pages.again("/a", () => Promise.reject(new Error("offline"))),
    ).rejects.toThrow("offline");
  });

  it("drops the held request when another page change starts", async () => {
    const pages = new KeptPages<string>();
    pages.keep("/a", "kept");
    pages.step("/a", () => Promise.resolve("held"));
    dropHeld();
    expect(await pages.again("/a", () => Promise.resolve("new"))).toBe("new");
  });
});

describe("forgetKept", () => {
  it("forgets every store, its held requests and a due load", async () => {
    const shell = new KeptPages<string>();
    const page = new KeptPages<string>();
    shell.keep("shell", "collections");
    page.keep("/a", "kept");
    page.step("/a", () => Promise.resolve("held"));
    forgetKept();
    expect(shell.get("shell")).toBeUndefined();
    expect(page.get("/a")).toBeUndefined();
    expect(takeLoadDue()).toBe(false);
    expect(await page.again("/a", () => Promise.resolve("new"))).toBe("new");
  });
});

describe("keptMiddleware", () => {
  const args = (method: string, initiator: string) => ({
    request: new Request("https://example.com/sheets", {
      method,
      ...(method === "GET" ? {} : { body: "" }),
    }),
    unstable_initiator: initiator,
  });
  const next = () => Promise.resolve("done");

  it("forgets every page before a change from a form or a fetcher", async () => {
    const pages = new KeptPages<string>();
    pages.keep("/sheets", "kept");
    let atNext: string | undefined = "unset";
    await keptMiddleware(args("POST", "fetcher"), () => {
      atNext = pages.get("/sheets");
      return next();
    });
    expect(atNext).toBeUndefined();
  });

  it("keeps the pages on a page change, and drops the held request", async () => {
    const pages = new KeptPages<string>();
    pages.keep("/a", "kept");
    pages.step("/a", () => Promise.resolve("held"));
    await expect(keptMiddleware(args("GET", "navigation"), next)).resolves.toBe(
      "done",
    );
    expect(pages.get("/a")).toBe("kept");
    expect(await pages.again("/a", () => Promise.resolve("new"))).toBe("new");
  });

  it("keeps the held request for the background load", async () => {
    const pages = new KeptPages<string>();
    pages.keep("/a", "kept");
    pages.step("/a", () => Promise.resolve("held"));
    await keptMiddleware(args("GET", "revalidation"), next);
    expect(await pages.again("/a", () => Promise.resolve("new"))).toBe("held");
  });
});

describe("loadsKeptAgain", () => {
  it("has no say outside the background load", () => {
    const pages = new KeptPages<string>();
    pages.keep("/a", "kept");
    pages.step("/a", () => Promise.resolve("fresh"));
    expect(loadsKeptAgain(pages, "/a")).toBeNull();
  });

  it("is a change's own rule again once a change forgets", () => {
    const pages = new KeptPages<string>();
    pages.keep("/a", "kept");
    pages.step("/a", () => Promise.resolve("fresh"));
    forgetKept();
    expect(isLoadingKeptAgain()).toBe(false);
    expect(loadsKeptAgain(pages, "/a")).toBeNull();
  });
});
