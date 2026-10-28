import { describe, expect, it } from "vitest";

import { cleanUpSection } from "./clean-up";
import { labeled, line, section } from "./test-helpers";

describe("Cleaning up a section", () => {
  it("drops empty lines", () => {
    const verse = section(
      line("Amazing grace, how sweet the sound", [0, "G"]),
      line("  "),
      line("That saved a wretch like me", [25, "D"]),
    );
    expect(cleanUpSection(verse)).toEqual(
      section(
        line("Amazing grace, how sweet the sound", [0, "G"]),
        line("That saved a wretch like me", [25, "D"]),
      ),
    );
  });

  it("keeps lines with only chords", () => {
    const intro = section(line("", [0, "G"], [0, "C"]));
    expect(cleanUpSection(intro)).toEqual(intro);
  });

  it("trims spaces at both ends of a line", () => {
    expect(
      cleanUpSection(section(line("  Amazing grace ", [2, "D"], [16, "G"]))),
    ).toEqual(section(line("Amazing grace", [0, "D"], [13, "G"])));
  });

  it("keeps a space with a chord", () => {
    const verse = section(line(" Amazing", [0, "G"]));
    expect(cleanUpSection(verse)).toEqual(verse);
  });

  it("trims up to a space with a chord", () => {
    expect(
      cleanUpSection(section(line("  Amazing grace  ", [1, "G"], [15, "D"]))),
    ).toEqual(section(line(" Amazing grace ", [0, "G"], [14, "D"])));
  });

  it("collapses double spaces inside a line", () => {
    expect(
      cleanUpSection(section(line("Amazing   grace,  how", [10, "D"]))),
    ).toEqual(section(line("Amazing grace, how", [8, "D"])));
  });

  it("keeps only the spaces with chords in a run", () => {
    expect(cleanUpSection(section(line("Amazing  grace", [8, "G"])))).toEqual(
      section(line("Amazing grace", [7, "G"])),
    );
    expect(
      cleanUpSection(section(line("Amazing   grace", [8, "G"], [9, "C"]))),
    ).toEqual(section(line("Amazing  grace", [7, "G"], [8, "C"])));
  });

  it("keeps surrogate pairs whole", () => {
    expect(cleanUpSection(section(line("🎵  la", [3, "G"])))).toEqual(
      section(line("🎵 la", [2, "G"])),
    );
  });

  it("drops a line of only spaces", () => {
    expect(cleanUpSection(section(line("Amazing grace"), line("   ")))).toEqual(
      section(line("Amazing grace")),
    );
  });

  it("removes a section with only empty lines", () => {
    expect(cleanUpSection(section(line(""), line(" ")))).toBeUndefined();
  });
});

describe("Cleaning up a label", () => {
  it("trims a label and collapses its spaces", () => {
    expect(cleanUpSection(labeled("  Verse   1 ", line("a")))).toEqual(
      labeled("Verse 1", line("a")),
    );
  });

  it("removes a label of only spaces", () => {
    expect(cleanUpSection(labeled("   ", line("a")))).toEqual(
      section(line("a")),
    );
  });

  it("keeps a clean label", () => {
    const chorus = labeled("Chorus", line("a"));
    expect(cleanUpSection(chorus)).toEqual(chorus);
  });
});
