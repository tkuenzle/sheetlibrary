import { describe, expect, it } from "vitest";

import { closeOffer, offerClosed } from "./passkey-offer";

describe("passkey offer cookie", () => {
  it("reads the closed cookie among others", () => {
    expect(offerClosed(null)).toBe(false);
    expect(offerClosed("a=1")).toBe(false);
    expect(offerClosed("a=1; passkey-offer=closed")).toBe(true);
    expect(offerClosed("passkey-offer=closedx")).toBe(false);
  });

  // Scenario "Closed before": the cookie outlasts the session.
  it("closes the offer for 400 days, on the whole site", () => {
    const target = { cookie: "", location: { protocol: "https:" } };
    closeOffer(target);
    expect(target.cookie).toBe(
      "passkey-offer=closed; Path=/; Max-Age=34560000; SameSite=Lax; Secure",
    );
    expect(offerClosed(target.cookie.split(";")[0] ?? null)).toBe(true);
  });

  it("leaves out Secure over http", () => {
    const target = { cookie: "", location: { protocol: "http:" } };
    closeOffer(target);
    expect(target.cookie).not.toContain("Secure");
  });
});
