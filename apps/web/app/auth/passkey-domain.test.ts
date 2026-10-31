import { describe, expect, it } from "vitest";

import { passkeyDomain } from "./passkey-domain";

describe("passkeyDomain", () => {
  it("uses the production host", () => {
    expect(passkeyDomain("sheetlibrary.com")).toBe("sheetlibrary.com");
  });

  it("shares one domain across previews", () => {
    expect(passkeyDomain("pr-70-sheetlibrary-preview.acme.workers.dev")).toBe(
      "acme.workers.dev",
    );
    expect(passkeyDomain("sheetlibrary-preview.acme.workers.dev")).toBe(
      "acme.workers.dev",
    );
  });

  it("uses localhost in local dev", () => {
    expect(passkeyDomain("localhost")).toBe("localhost");
  });
});
