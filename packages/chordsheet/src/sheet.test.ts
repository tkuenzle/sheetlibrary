import { describe, expect, it } from "vitest";

import { checkSheet } from "./check";
import { writeChord } from "./chord-symbol";
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
              chords: [{ at: 25, root: "D" }],
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

describe("Chords are stored as parts", () => {
  it("stores the root, the suffix and the bass", () => {
    const content = sheet(section(line("Amazing grace", [0, "Bb-7/F"])));
    expect(content.sections[0]?.lines[0]?.chords).toEqual([
      { at: 0, root: "Bb", suffix: "m7", bass: "F" },
    ]);
    expect(checkSheet(content)).toEqual([]);
    expect(store(content)).toEqual(content);
  });

  it("keeps the spelling", () => {
    const content = sheet(
      section(line("A sharp, B flat", [0, "A#"], [9, "Bb"])),
    );
    expect(checkSheet(content)).toEqual([]);
    expect(store(content)).toEqual(content);
    expect(content.sections[0]?.lines[0]?.chords.map((c) => c.root)).toEqual([
      "A#",
      "Bb",
    ]);
  });
});

describe("Chord order", () => {
  it("keeps a pile and a chord after the last letter in order", () => {
    const content = sheet(
      section(line("the hour", [0, "G7"], [0, "C"], [8, "D"], [8, "G"])),
    );
    expect(checkSheet(content)).toEqual([]);
    expect(store(content)).toEqual(content);
    expect(content.sections[0]?.lines[0]?.chords.map(writeChord)).toEqual([
      "G7",
      "C",
      "D",
      "G",
    ]);
  });
});
