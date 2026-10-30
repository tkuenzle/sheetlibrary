import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { pieces, SampleSheet, sampleLines } from "./sample-sheet";

describe("SampleSheet", () => {
  it("only takes lines the static layout gets right", () => {
    expect(sampleLines).toHaveLength(3);
    for (const line of sampleLines) {
      const spots = line.chords.map((chord) => chord.at);
      expect(new Set(spots).size).toBe(spots.length);
      for (const at of spots) expect(line.text[at]).not.toBe(" ");
    }
  });

  it("puts each chord above the lyrics from its letter", () => {
    expect(
      pieces({
        text: "That saved a wretch like me",
        chords: [{ at: 25, root: "D" }],
      }),
    ).toEqual([
      { chord: "", text: "That saved a wretch like " },
      { chord: "D", text: "me" },
    ]);
  });

  it("writes each chord in its canonical form", () => {
    expect(
      pieces({ text: "Amazing", chords: [{ at: 0, root: "G", suffix: "7" }] }),
    ).toEqual([{ chord: "G7", text: "Amazing" }]);
  });

  it("writes a chord's mark", () => {
    expect(
      pieces({ text: "Amazing", chords: [{ at: 0, root: "G", mark: "held" }] }),
    ).toEqual([{ chord: "(G)", text: "Amazing" }]);
  });

  it("is hidden from screen readers", () => {
    expect(renderToString(<SampleSheet />)).toMatch(
      /^<div class="sample-sheet" aria-hidden="true">/,
    );
  });
});
