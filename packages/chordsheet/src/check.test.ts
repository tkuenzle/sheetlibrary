import { describe, expect, it } from "vitest";

import { checkSheet } from "./check";
import { labeled, line, section, sheet } from "./test-helpers";

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
      section({ text: "How sweet", chords: [{ at: 4, root: "H" }] }, line("")),
    );
    expect(checkSheet(content)).toEqual([
      { message: "Chord root is not a note", section: 1, line: 0, chord: 0 },
      { message: "Line has no chords and no text", section: 1, line: 1 },
    ]);
  });

  it("rejects a suffix that isn't in canonical form", () => {
    for (const suffix of ["min7", "", "6/9", "(b9)", "m7 "]) {
      expect(
        messages(
          sheet(section({ text: "a", chords: [{ at: 0, root: "C", suffix }] })),
        ),
      ).toEqual(["Chord suffix is not in canonical form"]);
    }
  });

  it("rejects a bass on the root, and a bass that isn't a note", () => {
    expect(
      messages(
        sheet(
          section({
            text: "a",
            chords: [
              { at: 0, root: "C", bass: "C" },
              { at: 0, root: "C", bass: "c" },
            ],
          }),
        ),
      ),
    ).toEqual([
      "Chord bass is the same as its root",
      "Chord bass is not a note",
    ]);
  });

  it("rejects a chord without a root", () => {
    expect(
      messages(sheet(section({ text: "a", chords: [{ at: 0 }] } as never))),
    ).toEqual(["Chord root is not a note"]);
  });

  it("rejects line breaks in line text", () => {
    expect(messages(sheet(section(line("a\nb", [0, "G"]))))).toEqual([
      "Line text has a line break",
    ]);
  });

  it("allows a labeled section", () => {
    expect(checkSheet(sheet(labeled("Chorus", line("Amazing grace"))))).toEqual(
      [],
    );
  });

  it("rejects a label that isn't text", () => {
    const content = sheet({ label: 2, lines: [line("a")] } as never);
    expect(checkSheet(content)).toEqual([
      { message: "Section label is not text", section: 0 },
    ]);
  });

  it("rejects labels that are empty, too long or have a line break", () => {
    const content = sheet(
      labeled("   ", line("a")),
      labeled("a".repeat(41), line("b")),
      labeled("Verse\n1", line("c")),
    );
    expect(checkSheet(content)).toEqual([
      { message: "Section label is empty", section: 0 },
      { message: "Section label is longer than 40 characters", section: 1 },
      { message: "Section label has a line break", section: 2 },
    ]);
    expect(checkSheet(sheet(labeled("a".repeat(40), line("b"))))).toEqual([]);
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
