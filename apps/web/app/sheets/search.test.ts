import { describe, expect, it } from "vitest";

import {
  isSearch,
  MARK_END,
  MARK_START,
  markedParts,
  matchingLine,
  searchQuery,
} from "./search";

describe("isSearch", () => {
  // Scenario "One character".
  it("starts at 2 characters", () => {
    expect(isSearch("a")).toBe(false);
    expect(isSearch(" a ")).toBe(false);
    expect(isSearch("gr")).toBe(true);
  });
});

describe("searchQuery", () => {
  it("searches a word by its start", () => {
    expect(searchQuery("grac")).toBe('"grac"*');
  });

  it("finds each word on its own", () => {
    expect(searchQuery("grace newton")).toBe('"grace"* "newton"*');
  });

  // Scenario "Search syntax".
  it("drops quotes and words without a letter or a digit", () => {
    expect(searchQuery('"grace -')).toBe('"grace"*');
    expect(searchQuery("grace OR -newton")).toBe('"grace"* "OR"* "-newton"*');
  });

  it("is null when no word is left", () => {
    expect(searchQuery('" - :')).toBeNull();
  });
});

describe("markedParts", () => {
  it("marks the matches", () => {
    expect(markedParts(`Drüü ${MARK_START}Könige${MARK_END}`)).toEqual([
      { text: "Drüü ", hit: false },
      { text: "Könige", hit: true },
    ]);
  });

  it("has one part without a match", () => {
    expect(markedParts("Sternsinger")).toEqual([
      { text: "Sternsinger", hit: false },
    ]);
  });
});

describe("matchingLine", () => {
  it("gives the first line with a match", () => {
    expect(
      matchingLine(
        `Stille Nacht\nDrei ${MARK_START}Könige${MARK_END} ziehen\nDie ${MARK_START}Könige${MARK_END}`,
      ),
    ).toEqual([
      { text: "Drei ", hit: false },
      { text: "Könige", hit: true },
      { text: " ziehen", hit: false },
    ]);
  });

  it("starts a few words before a match far in", () => {
    expect(
      matchingLine(
        `Und hinter dem Stern am Himmel zogen die ${MARK_START}Könige${MARK_END} mit Gold`,
      ),
    ).toEqual([
      { text: "…am Himmel zogen die ", hit: false },
      { text: "Könige", hit: true },
      { text: " mit Gold", hit: false },
    ]);
  });

  it("is undefined without a match", () => {
    expect(matchingLine("Amazing grace")).toBeUndefined();
  });
});
