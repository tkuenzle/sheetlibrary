import { describe, expect, it } from "vitest";

import { readChord, writeChord } from "./chord-symbol";

// The canonical text of typed chord text, or null when it isn't a chord.
function written(text: string): string | null {
  const chord = readChord(text);
  return chord && writeChord(chord);
}

describe("Reading a chord", () => {
  it("reads the root, the suffix and the bass", () => {
    expect(readChord("Bb-7/F")).toEqual({
      root: "Bb",
      suffix: "m7",
      bass: "F",
    });
  });

  it("leaves out a suffix and a bass that aren't there", () => {
    expect(readChord("D")).toEqual({ root: "D" });
  });

  it("keeps the spelling", () => {
    expect(readChord("a#")).toEqual({ root: "A#" });
    expect(readChord("B♭")).toEqual({ root: "Bb" });
  });

  it("reads H as B", () => {
    expect(readChord("H7")).toEqual({ root: "B", suffix: "7" });
    expect(readChord("hm/F#")).toEqual({ root: "B", suffix: "m", bass: "F#" });
    expect(readChord("G/H")).toEqual({ root: "G", bass: "B" });
    expect(readChord("B")).toEqual({ root: "B" });
  });

  it("reads a lower-case root and bass, and ignores spaces at the ends", () => {
    expect(readChord(" am/e ")).toEqual({ root: "A", suffix: "m", bass: "E" });
    expect(readChord("bb")).toEqual({ root: "Bb" });
  });
});

describe("Canonical suffix", () => {
  it("reads aliases as the same part", () => {
    expect(readChord("CΔ7")?.suffix).toBe("maj7");
    expect(readChord("CM7")?.suffix).toBe("maj7");
    expect(readChord("Cmaj7")?.suffix).toBe("maj7");
  });

  it("writes the parts in order", () => {
    expect(readChord("G7sus")?.suffix).toBe("7sus4");
    expect(readChord("Dmin7(b5)")?.suffix).toBe("m7b5");
  });

  it("gives each chord one form", () => {
    expect(readChord("C6/9")?.suffix).toBe("6add9");
    expect(readChord("C2")?.suffix).toBe("add9");
    expect(readChord("Caug7")?.suffix).toBe("7#5");
    expect(readChord("C7add9")?.suffix).toBe("9");
  });

  it("drops a bass on the root", () => {
    expect(readChord("C/C")).toEqual({ root: "C" });
  });

  it("reads a suffix that only says major as a major triad", () => {
    for (const text of ["Cmaj", "CM", "CMaj"]) {
      expect(readChord(text)).toEqual({ root: "C" });
    }
  });
});

describe("One form per chord", () => {
  it("makes add9 the extension when there is a seventh", () => {
    expect(written("C7add9")).toBe("C9");
    expect(written("Cmaj7add9")).toBe("Cmaj9");
    expect(written("Cm7(add9)")).toBe("Cm9");
  });

  it("keeps add11 next to a seventh, since 11 holds the 9 as well", () => {
    expect(written("C7add11")).toBe("C7add11");
    expect(written("C11")).toBe("C11");
  });

  it("reads a 9 after a 6 as added", () => {
    expect(written("C6/9")).toBe("C6add9");
    expect(written("C69")).toBe("C6add9");
    expect(written("C6add9")).toBe("C6add9");
    expect(written("Cm69")).toBe("Cm6add9");
  });

  it("reads 6/9 before the bass", () => {
    expect(readChord("C6/9/E")).toEqual({
      root: "C",
      suffix: "6add9",
      bass: "E",
    });
  });

  it("reads 2 as add9", () => {
    expect(written("C2")).toBe("Cadd9");
    expect(written("Cadd2")).toBe("Cadd9");
    expect(written("Cm2")).toBe("Cmadd9");
  });

  it("makes aug a raised fifth when there is a 6, a 7 or an extension", () => {
    expect(written("Caug7")).toBe("C7#5");
    expect(written("C+7")).toBe("C7#5");
    expect(written("C7+")).toBe("C7#5");
    expect(written("Caug(maj7)")).toBe("Cmaj7#5");
    expect(written("Caug9")).toBe("C9#5");
    expect(written("Caugadd9")).toBe("Caugadd9");
  });

  it("keeps dim alone or with 7", () => {
    expect(written("Cdim7")).toBe("Cdim7");
    expect(written("C°7")).toBe("Cdim7");
    expect(written("Co")).toBe("Cdim");
    expect(readChord("Cdim9")).toBeNull();
    expect(readChord("Cdimadd9")).toBeNull();
  });

  it("refuses sus with a quality", () => {
    for (const text of ["Cmsus4", "Cdimsus4", "Caugsus4", "C5sus4"]) {
      expect(readChord(text)).toBeNull();
    }
  });

  it("drops a bass on the root, but not an enharmonic one", () => {
    expect(written("C/C")).toBe("C");
    expect(written("Cm7/C")).toBe("Cm7");
    expect(written("C/B#")).toBe("C/B#");
  });

  it("writes alterations by degree and after sus, without brackets", () => {
    expect(written("C7#9#5")).toBe("C7#5#9");
    expect(written("C7sus4(b9)")).toBe("C7sus4b9");
    expect(written("C7(b9,#11)")).toBe("C7b9#11");
  });

  it("reads a sharp right after the letter as part of the root", () => {
    expect(readChord("C#5")).toEqual({ root: "C#", suffix: "5" });
    expect(readChord("C+5")).toEqual({ root: "C", suffix: "aug" });
  });

  it("refuses alterations without a 6, a 7 or an extension", () => {
    expect(readChord("Cb9")).toEqual({ root: "Cb", suffix: "9" });
    expect(readChord("C-5")).toBeNull();
    expect(readChord("Cmb5")).toBeNull();
  });
});

describe("Text that isn't a chord", () => {
  it("refuses text outside the grammar", () => {
    for (const text of ["N.C.", "Cmj7", "I7", "", "x2", "(riff)", "C7b9b9"]) {
      expect(readChord(text)).toBeNull();
    }
  });

  it("refuses spaces inside", () => {
    expect(readChord("C m7")).toBeNull();
  });
});

describe("Writing a chord", () => {
  it("writes the root, the suffix and the bass", () => {
    expect(writeChord({ root: "Bb", suffix: "m7", bass: "F" })).toBe("Bbm7/F");
    expect(writeChord({ root: "G" })).toBe("G");
  });
});

// Chords as they appear on Ultimate Guitar sheets, with their canonical text.
const ULTIMATE_GUITAR: [string, string][] = [
  ["G", "G"],
  ["Em", "Em"],
  ["F#m", "F#m"],
  ["C#m7", "C#m7"],
  ["Bb", "Bb"],
  ["Ebmaj7", "Ebmaj7"],
  ["Abmaj7", "Abmaj7"],
  ["Am7", "Am7"],
  ["Dm6", "Dm6"],
  ["E7", "E7"],
  ["G7", "G7"],
  ["D9", "D9"],
  ["A13", "A13"],
  ["Dm11", "Dm11"],
  ["Fmaj9", "Fmaj9"],
  ["Cmaj13", "Cmaj13"],
  ["Dsus4", "Dsus4"],
  ["Dsus2", "Dsus2"],
  ["Asus", "Asus4"],
  ["A7sus4", "A7sus4"],
  ["Esus4/G#", "Esus4/G#"],
  ["Cadd9", "Cadd9"],
  ["Cadd9/E", "Cadd9/E"],
  ["G2", "Gadd9"],
  ["Emadd9", "Emadd9"],
  ["G/B", "G/B"],
  ["D/F#", "D/F#"],
  ["Am/G", "Am/G"],
  ["Bb/D", "Bb/D"],
  ["F/C", "F/C"],
  ["Bm7b5", "Bm7b5"],
  ["Bm7-5", "Bm7b5"],
  ["Bø", "Bm7b5"],
  ["Bdim", "Bdim"],
  ["Bdim7", "Bdim7"],
  ["G#°7", "G#dim7"],
  ["Eaug", "Eaug"],
  ["E+", "Eaug"],
  ["E7#9", "E7#9"],
  ["G7b9", "G7b9"],
  ["C7(#11)", "C7#11"],
  ["A5", "A5"],
  ["E5", "E5"],
  ["F#5", "F#5"],
  ["Cm(maj7)", "Cmmaj7"],
  ["C6", "C6"],
  ["Am6", "Am6"],
  ["Gmaj7", "Gmaj7"],
  ["Gmaj7/F#", "Gmaj7/F#"],
  ["Amin", "Am"],
  ["Ami7", "Am7"],
];

describe("Chords from Ultimate Guitar", () => {
  it.each(ULTIMATE_GUITAR)("reads %s as %s", (typed, text) => {
    expect(written(typed)).toBe(text);
  });

  it.each(ULTIMATE_GUITAR)("reads %s back as the same chord", (typed) => {
    const chord = readChord(typed);
    expect(chord && readChord(writeChord(chord))).toEqual(chord);
  });
});
