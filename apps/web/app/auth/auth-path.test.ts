import { describe, expect, it } from "vitest";

import { isAuthPath } from "./auth-path";

describe("isAuthPath", () => {
  it("matches Better Auth's paths", () => {
    expect(isAuthPath("/api/auth")).toBe(true);
    expect(isAuthPath("/api/auth/sign-in/magic-link")).toBe(true);
  });

  it("leaves other paths to React Router", () => {
    expect(isAuthPath("/")).toBe(false);
    expect(isAuthPath("/account")).toBe(false);
    expect(isAuthPath("/api/authors")).toBe(false);
  });
});
