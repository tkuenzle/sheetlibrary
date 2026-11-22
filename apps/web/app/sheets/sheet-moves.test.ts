import { describe, expect, it } from "vitest";

import {
  afterDelete,
  backFromPlay,
  doneFromEdit,
  fromEditMode,
  fromPlayState,
  sheetHistory,
} from "./sheet-moves";

const play = "/sheets/abc?key=A";

describe("sheet moves", () => {
  describe("opened from the list", () => {
    // Sheets (0) -> play (1) -> edit (2)
    const onPlay = { index: 1, fromPlay: false };
    const onEdit = { index: 2, fromPlay: true };

    // Scenario "Back to a search" (site-layout).
    it("steps back from play to the list", () => {
      expect(backFromPlay(onPlay)).toEqual({ step: -1 });
    });

    // Scenario "The browser's back" (sheet-page).
    it("steps back from edit mode to play", () => {
      expect(doneFromEdit(onEdit, play)).toEqual({ step: -1 });
    });

    // Scenario "Deleting" (sheet-page).
    it("steps back past play after a delete in edit mode", () => {
      expect(afterDelete("edit", onEdit)).toEqual({ step: -2 });
      expect(afterDelete("play", onPlay)).toEqual({ step: -1 });
    });
  });

  describe("opened from a link", () => {
    // play (0) -> edit (1)
    const onPlay = { index: 0, fromPlay: false };
    const onEdit = { index: 1, fromPlay: true };

    // Scenario "Opened from a link" (site-layout).
    it("opens Sheets from play", () => {
      expect(backFromPlay(onPlay)).toEqual({ to: "/sheets", replace: false });
    });

    it("steps back from edit mode to play", () => {
      expect(doneFromEdit(onEdit, play)).toEqual({ step: -1 });
    });

    it("replaces the sheet with Sheets after a delete", () => {
      expect(afterDelete("play", onPlay)).toEqual({
        to: "/sheets",
        replace: true,
      });
      expect(afterDelete("edit", onEdit)).toEqual({
        to: "/sheets",
        replace: true,
      });
    });
  });

  describe("opened from New sheet", () => {
    // Sheets (0) -> edit (1), without a play entry below
    const onEdit = { index: 1, fromPlay: false };

    it("replaces edit mode with play on Done, keeping the index", () => {
      expect(doneFromEdit(onEdit, play)).toEqual({ to: play, replace: true });
      // The replaced entry keeps index 1, so Back from play steps back.
      expect(backFromPlay({ index: 1, fromPlay: false })).toEqual({
        step: -1,
      });
    });

    it("steps back to the list after a delete", () => {
      expect(afterDelete("edit", onEdit)).toEqual({ step: -1 });
    });
  });

  describe("reading the history", () => {
    it("reads React Router's index and Edit's state", () => {
      expect(sheetHistory({ state: fromPlayState }, { idx: 3 })).toEqual({
        index: 3,
        fromPlay: true,
      });
    });

    it("counts a missing or odd state as the first entry, not from play", () => {
      expect(sheetHistory({ state: null }, null)).toEqual({
        index: 0,
        fromPlay: false,
      });
      expect(sheetHistory({ state: "x" }, { idx: "2" })).toEqual({
        index: 0,
        fromPlay: false,
      });
    });
  });
});

describe("fromEditMode", () => {
  const url = new URL("https://example.com/sheets/abc?key=A");

  it("sees play after its own edit mode", () => {
    expect(fromEditMode(url, "/sheets/abc/edit")).toBe(true);
  });

  it("doesn't count another page or another sheet's edit mode", () => {
    expect(fromEditMode(url, "/sheets")).toBe(false);
    expect(fromEditMode(url, "/sheets/xyz/edit")).toBe(false);
    expect(fromEditMode(url, null)).toBe(false);
  });
});
