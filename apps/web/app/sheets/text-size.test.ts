import { describe, expect, it } from "vitest";

import {
  keepTextStep,
  MAX_TEXT_STEP,
  MIN_TEXT_STEP,
  readTextStep,
  textSize,
} from "./text-size";

describe("text size cookie", () => {
  it("reads the step among other cookies", () => {
    expect(readTextStep("a=1; play-text-size=2")).toBe(2);
    expect(readTextStep("play-text-size=-1; a=1")).toBe(-1);
  });

  it("gives the default without the cookie, or with a wrong value", () => {
    expect(readTextStep(null)).toBe(0);
    expect(readTextStep("a=1")).toBe(0);
    expect(readTextStep("play-text-size=big")).toBe(0);
    expect(readTextStep("play-text-size=")).toBe(0);
    expect(readTextStep("play-text-size=1.5")).toBe(0);
    expect(readTextStep("play-text-size=12")).toBe(0);
  });

  it("only reads steps between the smallest and the largest", () => {
    expect(readTextStep(`play-text-size=${String(MAX_TEXT_STEP)}`)).toBe(3);
    expect(readTextStep(`play-text-size=${String(MIN_TEXT_STEP)}`)).toBe(-2);
    expect(readTextStep("play-text-size=4")).toBe(0);
    expect(readTextStep("play-text-size=-3")).toBe(0);
  });

  // Scenario "Larger on this device".
  it("keeps the step for 400 days, on the whole site", () => {
    const target = { cookie: "", location: { protocol: "https:" } };
    keepTextStep(2, target);
    expect(target.cookie).toBe(
      "play-text-size=2; Path=/; Max-Age=34560000; SameSite=Lax; Secure",
    );
    expect(readTextStep(target.cookie)).toBe(2);
  });

  it("leaves out Secure over http", () => {
    const target = { cookie: "", location: { protocol: "http:" } };
    keepTextStep(1, target);
    expect(target.cookie).not.toContain("Secure");
  });
});

describe("text size", () => {
  it("scales the base size by the step", () => {
    expect(textSize(0)).toBe("var(--play-text-base)");
    expect(textSize(-2)).toBe("calc(var(--play-text-base) * 0.8)");
    expect(textSize(1)).toBe("calc(var(--play-text-base) * 1.15)");
    expect(textSize(3)).toBe("calc(var(--play-text-base) * 1.5)");
  });
});
