import { describe, expect, it } from "vitest";

import { afterMove, redirectTarget } from "./awaited";

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

describe("afterMove", () => {
  // Without a document, as on the server, there is no move to wait for.
  it("gives the data as it arrives when nothing moves", async () => {
    await expect(afterMove(Promise.resolve({ rows: 3 }))).resolves.toEqual({
      rows: 3,
    });
  });

  it("passes a failure on", async () => {
    await expect(
      afterMove(Promise.reject(new Error("offline"))),
    ).rejects.toThrow("offline");
  });
});
