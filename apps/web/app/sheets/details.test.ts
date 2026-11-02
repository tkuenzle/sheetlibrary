import { describe, expect, it } from "vitest";

import { keptArtist, keptTitle } from "./details";

describe("keptTitle", () => {
  it("keeps the text, trimmed", () => {
    expect(keptTitle("  Amazing Grace ")).toBe("Amazing Grace");
  });

  // Scenario "Clearing the title".
  it("goes back to Untitled when the text is empty", () => {
    expect(keptTitle("")).toBe("Untitled");
    expect(keptTitle("   ")).toBe("Untitled");
  });
});

describe("keptArtist", () => {
  it("keeps the text, trimmed", () => {
    expect(keptArtist(" Chris Tomlin ")).toBe("Chris Tomlin");
  });

  // Scenario "Removing the artist".
  it("removes the artist when the text is empty", () => {
    expect(keptArtist("")).toBeUndefined();
    expect(keptArtist("  ")).toBeUndefined();
  });
});
