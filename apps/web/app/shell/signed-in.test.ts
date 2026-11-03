import { describe, expect, it } from "vitest";

import { initialOf } from "./signed-in";

describe("initialOf", () => {
  it("is the email's first letter, in upper case", () => {
    expect(initialOf("ana@example.com")).toBe("A");
  });
});
