import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  fromAnotherPage,
  headStart,
  noteSkeletonShown,
  redirectTarget,
} from "./awaited";

describe("redirectTarget", () => {
  it("gives where a redirect leads", () => {
    const response = new Response(null, {
      status: 302,
      headers: { Location: "/sign-in" },
    });
    expect(redirectTarget(response)).toBe("/sign-in");
  });

  it("gives nothing for other answers and errors", () => {
    expect(redirectTarget(new Response(null, { status: 404 }))).toBeNull();
    expect(redirectTarget(new Error("offline"))).toBeNull();
    expect(redirectTarget(undefined)).toBeNull();
  });
});

describe("headStart", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const after = <T>(ms: number, value: T) =>
    new Promise<T>((resolve) => {
      setTimeout(() => {
        resolve(value);
      }, ms);
    });

  it("gives the data whole when it arrives in time", async () => {
    const result = headStart(after(50, { rows: 3 }), 150);
    await vi.advanceTimersByTimeAsync(50);
    await expect(result).resolves.toEqual({ page: { rows: 3 } });
  });

  it("gives the data on its way when it is late", async () => {
    const result = headStart(after(400, { rows: 3 }), 150);
    await vi.advanceTimersByTimeAsync(150);
    const { page } = await result;
    expect(page).toBeInstanceOf(Promise);
    await vi.advanceTimersByTimeAsync(250);
    await expect(page).resolves.toEqual({ rows: 3 });
  });

  it("hands the data over at once without a wait", async () => {
    const { page } = await headStart(after(50, { rows: 3 }), 0);
    expect(page).toBeInstanceOf(Promise);
  });

  // Whether held data has come through yet.
  function watch(page: unknown) {
    const state = { through: false };
    void (page as Promise<unknown>).then(() => {
      state.through = true;
    });
    return state;
  }

  // The skeleton's bars stay at least `holdMs` from when they show, which
  // can be well after the handover.
  it("holds late data until the hold after the skeleton showed", async () => {
    const result = headStart(after(200, "rows"), 150, 400);
    await vi.advanceTimersByTimeAsync(150);
    const data = watch((await result).page);
    await vi.advanceTimersByTimeAsync(300);
    noteSkeletonShown();
    await vi.advanceTimersByTimeAsync(399);
    expect(data.through).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(data.through).toBe(true);
  });

  it("gives data that comes after the hold as it comes", async () => {
    const data = watch((await headStart(after(900, "rows"), 0, 400)).page);
    noteSkeletonShown();
    await vi.advanceTimersByTimeAsync(899);
    expect(data.through).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(data.through).toBe(true);
  });

  it("doesn't wait forever for a skeleton that never shows", async () => {
    const data = watch((await headStart(after(50, "rows"), 0, 400)).page);
    await vi.advanceTimersByTimeAsync(4999);
    expect(data.through).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(data.through).toBe(true);
  });

  it("passes a late failure on at once", async () => {
    const failing = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("offline"));
      }, 200);
    });
    const { page } = await headStart(failing, 0, 400);
    const caught = expect(page).rejects.toThrow("offline");
    await vi.advanceTimersByTimeAsync(200);
    await caught;
  });

  it("throws a failure that comes in time", async () => {
    const data = Promise.reject(new Error("offline"));
    await expect(headStart(data, 150)).rejects.toThrow("offline");
  });
});

describe("fromAnotherPage", () => {
  const url = (address: string) => new URL(address, "https://example.com");

  // On a push the page on screen is the one being left; on a step back too,
  // though the address already names the new page.
  it("sees a move to another page", () => {
    expect(fromAnotherPage(url("/collections/a"), "/sheets")).toBe(true);
    expect(fromAnotherPage(url("/sheets"), "/sheets/a")).toBe(true);
  });

  it("sees the page that is open loading again, as for a search", () => {
    expect(fromAnotherPage(url("/sheets?q=grace"), "/sheets")).toBe(false);
  });

  it("counts play after edit as another page", () => {
    expect(fromAnotherPage(url("/sheets/a"), "/sheets/a/edit")).toBe(true);
  });

  it("sees another page before any has shown", () => {
    expect(fromAnotherPage(url("/sheets"), null)).toBe(true);
  });
});
