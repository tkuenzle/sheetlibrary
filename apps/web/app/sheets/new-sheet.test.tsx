import { describe, expect, it } from "vitest";

import { newSheetItems, type NewSheetWay } from "./new-sheet";

describe("newSheetItems", () => {
  // Requirement "New sheet".
  it("lists the three ways, in order, each picking its own way", () => {
    const picked: NewSheetWay[] = [];
    const items = newSheetItems((way) => picked.push(way));
    expect(items.map((item) => [item.label, item.icon])).toEqual([
      ["Write a new sheet", "edit"],
      ["From photos…", "photoCamera"],
      ["From Ultimate Guitar…", "link"],
    ]);
    for (const item of items) item.onSelect();
    expect(picked).toEqual(["write", "photos", "ultimate-guitar"]);
  });
});
