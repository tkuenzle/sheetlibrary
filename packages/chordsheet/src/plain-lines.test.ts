import { describe, expect, it } from "vitest";

import { plainLines } from "./plain-lines";
import { labeled, line, section, sheet } from "./test-helpers";

// The characters the library marks search matches with.
const START = String.fromCharCode(0xe000);
const END = String.fromCharCode(0xe001);

describe("Lyrics as plain text", () => {
  it("gives each line's text in order, without chords or labels", () => {
    const content = sheet(
      labeled(
        "Verse",
        line("Amazing grace", [0, "G"], [8, "C"]),
        line("How sweet the sound", [0, "D"]),
      ),
      section(line("Was blind", [4, "G"])),
    );
    expect(plainLines(content)).toEqual([
      "Amazing grace",
      "How sweet the sound",
      "Was blind",
    ]);
  });

  it("leaves out a line with only chords", () => {
    const content = sheet(
      section(line("", [0, "G"], [0, "C"]), line("Amazing grace", [0, "G"])),
    );
    expect(plainLines(content)).toEqual(["Amazing grace"]);
  });

  it("drops the characters that mark search matches", () => {
    const content = sheet(section(line(`Amazing${START} grace${END}`)));
    expect(plainLines(content)).toEqual(["Amazing grace"]);
  });
});
