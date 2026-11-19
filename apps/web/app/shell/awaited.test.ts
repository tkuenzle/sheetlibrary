import { describe, expect, it } from "vitest";

import { holdBars, redirectTarget } from "./awaited";

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

describe("holdBars", () => {
  // No skeleton showed its bars, as while a move plays: nothing waits.
  it("gives the data as it arrives when no bars are held", async () => {
    await expect(holdBars(Promise.resolve({ rows: 3 }))).resolves.toEqual({
      rows: 3,
    });
  });

  it("passes a failure on at once", async () => {
    await expect(
      holdBars(Promise.reject(new Error("offline"))),
    ).rejects.toThrow("offline");
  });
});
