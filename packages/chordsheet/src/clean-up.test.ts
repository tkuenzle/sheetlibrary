import { describe, expect, it } from "vitest";

import { cleanUpSection } from "./clean-up";
import { line, section } from "./test-helpers";

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

  it("removes a section with only empty lines", () => {
    expect(cleanUpSection(section(line(""), line(" ")))).toBeUndefined();
  });
});
