import { describe, expect, it } from "vitest";

import {
  collectionNameKey,
  keptCollectionName,
  sheetCount,
  sortedBy,
} from "./collections";

describe("collection rules", () => {
  it("keeps a trimmed name of 1 to 40 characters", () => {
    expect(keptCollectionName("  Christmas ")).toBe("Christmas");
    expect(keptCollectionName("   ")).toBeNull();
    expect(keptCollectionName("x".repeat(40))).toBe("x".repeat(40));
    expect(keptCollectionName("x".repeat(41))).toBeNull();
  });

  it("gives names that differ only in case the same key", () => {
    expect(collectionNameKey("Christmas")).toBe(collectionNameKey("christmas"));
    expect(collectionNameKey("Äpfel")).toBe(collectionNameKey("äpfel"));
    // "Ä" as A and a combining diaeresis.
    expect(collectionNameKey("Äpfel")).toBe(collectionNameKey("Äpfel"));
  });

  it("sorts as people read it", () => {
    expect(
      sortedBy(["Lied 10", "Drüü Könige", "lied 2", "Campfire"], (s) => s),
    ).toEqual(["Campfire", "Drüü Könige", "lied 2", "Lied 10"]);
  });

  it("counts sheets", () => {
    expect(sheetCount(0)).toBe("0 sheets");
    expect(sheetCount(1)).toBe("1 sheet");
    expect(sheetCount(14)).toBe("14 sheets");
  });
});
