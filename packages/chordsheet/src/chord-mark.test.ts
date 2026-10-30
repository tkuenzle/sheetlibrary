import { describe, expect, it } from "vitest";

import { readMarkedChord, writeMarkedChord } from "./chord-mark";

// The canonical text of typed chord text, or null when it isn't a chord.
function written(text: string): string | null {
  const chord = readMarkedChord(text);
  return chord && writeMarkedChord(chord);
}

describe("Marked chords", () => {
  it("reads round brackets as held", () => {
    expect(readMarkedChord("(Bb-7)")).toEqual({
      root: "Bb",
      suffix: "m7",
      mark: "held",
    });
    expect(written("(Bb-7)")).toBe("(Bbm7)");
  });

  it("reads square brackets as optional, ignoring spaces inside", () => {
    expect(readMarkedChord("[ G7 ]")).toEqual({
      root: "G",
      suffix: "7",
      mark: "optional",
    });
    expect(written("[ G7 ]")).toBe("[G7]");
  });

  it("reads a chord without brackets without a mark", () => {
    expect(readMarkedChord("Am")).toEqual({ root: "A", suffix: "m" });
  });

  it("keeps brackets inside the chord apart from the mark", () => {
    expect(written("Dmin7(b5)")).toBe("Dm7b5");
    expect(written("(Dmin7(b5))")).toBe("(Dm7b5)");
  });

  it("refuses brackets that don't match", () => {
    for (const text of ["(C]", "[C)", "(C", "C)", "((C))", "()"]) {
      expect(readMarkedChord(text)).toBeNull();
    }
  });
});
