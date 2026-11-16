import { describe, expect, it } from "vitest";

import { handViewBack, takeHandedView } from "./view-hand-off";

describe("view hand-off", () => {
  const a = { tonic: "A", minor: false } as const;

  // Scenario "The browser's back" (sheet-page).
  it("hands the key and the capo to the same sheet once", () => {
    handViewBack("abc", { shown: a, capo: 2 });
    expect(takeHandedView("other")).toBeUndefined();
    expect(takeHandedView("abc")).toEqual({ shown: a, capo: 2 });
    expect(takeHandedView("abc")).toBeUndefined();
  });

  it("keeps only the last hand-off", () => {
    handViewBack("abc", { shown: a, capo: 2 });
    handViewBack("abc", { shown: null, capo: 0 });
    expect(takeHandedView("abc")).toEqual({ shown: null, capo: 0 });
  });
});
