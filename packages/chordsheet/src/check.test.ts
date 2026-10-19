import { describe, expect, it } from "vitest";

import { checkSheet } from "./check";
import { line, section, sheet } from "./test-helpers";

function messages(content: unknown): string[] {
  return checkSheet(content).map((problem) => problem.message);
}

describe("Versions", () => {
  it("rejects an unknown version", () => {
    expect(checkSheet({ ...sheet(), version: 99 })).toEqual([
      { message: "Unknown version: 99" },
    ]);
  });

  it("rejects content of another format", () => {
    expect(messages({ ...sheet(), format: "musicxml" })).toEqual([
      'Format is not "chordsheet"',
    ]);
  });
});

describe("Chord positions", () => {
  it("allows a chord after the last letter", () => {
    expect(checkSheet(sheet(section(line("me", [2, "D"]))))).toEqual([]);
  });

  it("rejects positions outside the text", () => {
    const content = sheet(
      section(
        line("me", [-1, "C"]),
        line("me", [3, "D"]),
        line("me", [0.5, "E"]),
      ),
    );
    expect(messages(content)).toEqual([
      "Chord position is outside the text",
      "Chord position is outside the text",
      "Chord position is outside the text",
    ]);
  });

  it("rejects a position inside a surrogate pair", () => {
    // "🎸" is two UTF-16 code units.
    expect(messages(sheet(section(line("a🎸b", [2, "G"]))))).toEqual([
      "Chord position splits a character",
    ]);
    expect(checkSheet(sheet(section(line("a🎸b", [3, "G"]))))).toEqual([]);
  });
});

describe("Chord order", () => {
  it("allows a pile at one position", () => {
    expect(
      checkSheet(sheet(section(line("the", [0, "G7"], [0, "C"])))),
    ).toEqual([]);
  });

  it("rejects chords out of order", () => {
    expect(checkSheet(sheet(section(line("the", [2, "G"], [0, "C"]))))).toEqual(
      [
        {
          message: "Chords are not sorted by position",
          section: 0,
          line: 0,
          chord: 1,
        },
      ],
    );
  });
});

describe("No empty lines", () => {
  it("allows a line with only chords", () => {
    const content = sheet(section(line("  ", [0, "G"], [1, "C"], [2, "D"])));
    expect(checkSheet(content)).toEqual([]);
  });

  it("rejects a line without chords that is empty or only spaces", () => {
    expect(messages(sheet(section(line(""), line("   "))))).toEqual([
      "Line has no chords and no text",
      "Line has no chords and no text",
    ]);
  });
});

describe("Checking a sheet", () => {
  it("reports nothing for a valid sheet", () => {
    const content = sheet(
      section(line("Amazing grace", [0, "G"], [8, "G7"])),
      section(line("The hour I first believed", [4, "Em"])),
    );
    expect(checkSheet(content)).toEqual([]);
  });

  it("reports every problem with where it is", () => {
    const content = sheet(
      section(line("Amazing grace", [0, "G"])),
      section(line("How sweet", [4, ""]), line("")),
    );
    expect(checkSheet(content)).toEqual([
      { message: "Chord text is empty", section: 1, line: 0, chord: 0 },
      { message: "Line has no chords and no text", section: 1, line: 1 },
    ]);
  });

  it("rejects line breaks in line and chord text", () => {
    expect(messages(sheet(section(line("a\nb", [0, "G\nC"]))))).toEqual([
      "Line text has a line break",
      "Chord text has a line break",
    ]);
  });

  it("rejects a section without lines", () => {
    expect(checkSheet(sheet(section()))).toEqual([
      { message: "Section has no lines", section: 0 },
    ]);
  });

  it("rejects content of the wrong shape", () => {
    expect(messages(null)).toEqual(["Content is not an object"]);
    expect(messages({ format: "chordsheet", version: 1 })).toEqual([
      "Sections are not a list",
    ]);
    expect(
      messages(sheet({ lines: [{ text: "a" }] } as never, {} as never)),
    ).toEqual([
      "Line has no text or no list of chords",
      "Section has no list of lines",
    ]);
  });
});
