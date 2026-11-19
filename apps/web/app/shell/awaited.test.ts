import { describe, expect, it } from "vitest";

import { redirectTarget } from "./awaited";

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
