import { describe, expect, it } from "vitest";

import { keepEditHelpSeen, readEditHelpSeen } from "./edit-help";

describe("edit help cookie", () => {
  // Scenario "Got it".
  it("reads whether the note was put away on this device", () => {
    expect(readEditHelpSeen(null)).toBe(false);
    expect(readEditHelpSeen("play-text-size=1")).toBe(false);
    expect(readEditHelpSeen("play-text-size=1; edit-help=seen")).toBe(true);
    expect(readEditHelpSeen("edit-help=other")).toBe(false);
  });

  it("keeps it for the whole site, Secure only over https", () => {
    const local = { cookie: "", location: { protocol: "http:" } };
    keepEditHelpSeen(local);
    expect(local.cookie).toBe(
      "edit-help=seen; Path=/; Max-Age=34560000; SameSite=Lax",
    );
    const site = { cookie: "", location: { protocol: "https:" } };
    keepEditHelpSeen(site);
    expect(site.cookie).toMatch(/; Secure$/);
    expect(readEditHelpSeen(site.cookie.split(";")[0] ?? "")).toBe(true);
  });
});
