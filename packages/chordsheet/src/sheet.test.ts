import { describe, expect, it } from "vitest";

import { checkSheet } from "./check";
import type { ChordSheet } from "./sheet";
import { line, section, sheet } from "./test-helpers";

// Stores content as JSON and reads it back.
function store(content: ChordSheet): unknown {
  return JSON.parse(JSON.stringify(content));
}

describe("Sheet content", () => {
  it("holds a line's text and its chords by position", () => {
    const content: ChordSheet = {
      format: "chordsheet",
      version: 1,
      sections: [
        {
          lines: [
            {
              text: "That saved a wretch like me",
              chords: [{ at: 25, chord: "D" }],
            },
          ],
        },
      ],
    };
    expect(content.sections[0]?.lines[0]?.text.slice(25)).toBe("me");
    expect(checkSheet(content)).toEqual([]);
    expect(store(content)).toEqual(content);
  });
});

describe("Chords are text", () => {
  it("keeps spelling and annotations unchanged", () => {
    const content = sheet(
      section(
        line("A sharp, B flat, no chord", [0, "A#"], [9, "Bb"], [17, "*N.C."]),
      ),
    );
    expect(checkSheet(content)).toEqual([]);
    expect(store(content)).toEqual(content);
  });
});

describe("Chord order", () => {
  it("keeps a pile and a chord after the last letter in order", () => {
    const content = sheet(
      section(line("the hour", [0, "G7"], [0, "C"], [8, "D"], [8, "G"])),
    );
    expect(checkSheet(content)).toEqual([]);
    expect(store(content)).toEqual(content);
    expect(content.sections[0]?.lines[0]?.chords.map((c) => c.chord)).toEqual([
      "G7",
      "C",
      "D",
      "G",
    ]);
  });
});
