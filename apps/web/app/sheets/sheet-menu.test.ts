import { describe, expect, it, vi } from "vitest";

import { sheetMenuItems } from "./sheet-menu";

describe("sheet menu", () => {
  const noop = () => undefined;

  // Scenario "The same in edit mode" (play-page).
  it("holds Choose collections, Print and Delete, and no Rename", () => {
    expect(
      sheetMenuItems({ onChoose: noop, onDelete: noop }).map((i) => i.label),
    ).toEqual(["Choose collections…", "Print", "Delete"]);
  });

  it("calls each item's action", () => {
    const onChoose = vi.fn();
    const onDelete = vi.fn();
    const print = vi.fn();
    for (const item of sheetMenuItems({ onChoose, onDelete, print })) {
      item.onSelect();
    }
    expect(onChoose).toHaveBeenCalledOnce();
    expect(print).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
  });

  // Scenario "Deleted in another tab" (sheet-page).
  it("disables Delete once the sheet is gone", () => {
    const items = sheetMenuItems({ onChoose: noop, onDelete: noop });
    expect(items.find((i) => i.label === "Delete")?.disabled).toBe(false);
    const gone = sheetMenuItems({
      onChoose: noop,
      onDelete: noop,
      deleted: true,
    });
    expect(gone.find((i) => i.label === "Delete")?.disabled).toBe(true);
  });
});
