import { describe, expect, it } from "vitest";

import { lyricsFontWidths, widthOf } from "./widths";

describe("widthOf", () => {
  it("adds up the widths of the letters", () => {
    const { 400: regular } = lyricsFontWidths;
    expect(widthOf("Grace", 400, lyricsFontWidths)).toBeCloseTo(
      ["G", "r", "a", "c", "e"].reduce((sum, c) => sum + (regular[c] ?? 0), 0),
    );
  });

  it("is wider at the chords' weight", () => {
    expect(widthOf("Am7", 700, lyricsFontWidths)).toBeGreaterThan(
      widthOf("Am7", 400, lyricsFontWidths),
    );
  });

  it("counts a character the font doesn't have as 1em", () => {
    expect(widthOf("ж", 400, lyricsFontWidths)).toBe(1);
    expect(widthOf("aж", 400, lyricsFontWidths)).toBeCloseTo(
      1 + (lyricsFontWidths[400].a ?? 0),
    );
  });
});
