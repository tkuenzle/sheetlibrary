import { describe, expect, it } from "vitest";

import { readChord, writeChord } from "./chord-symbol";
import type { Key } from "./keys";
import { suggestChords, typedMark } from "./suggestions";
import { read } from "./test-helpers";

const G: Key = { tonic: "G", minor: false };

// The suggestions as text, those the sheet doesn't use in brackets: "<Am>".
function suggested(text: string, sheet: string[], key: Key | null = G) {
  return suggestChords(text, sheet.map(read), key).map(({ chord, inSheet }) =>
    inSheet ? writeChord(chord) : `<${writeChord(chord)}>`,
  );
}

describe("Chord suggestions", () => {
  it("lists the sheet's chords by use, then the key's", () => {
    expect(suggested("", ["G", "D", "G", "C"])).toEqual([
      "G",
      "D",
      "C",
      "<Am>",
      "<Bm>",
      "<Em>",
      "<F#dim>",
    ]);
  });

  it("breaks a tie by first use", () => {
    expect(suggested("", ["Em", "C"], null)).toEqual(["Em", "C"]);
  });

  it("counts a marked chord as the chord", () => {
    expect(suggested("", ["C", "(G)", "G"], null)).toEqual(["G", "C"]);
  });

  it("narrows to the typed text and completes it", () => {
    const shown = suggested("d", ["G", "D", "C"]);
    expect(shown[0]).toBe("D");
    expect(shown).toEqual(expect.arrayContaining(["<D7>", "<Dsus4>", "<Dm>"]));
    expect(shown).not.toContain("G");
    expect(shown).not.toContain("C");
  });

  it("reads the typed text as a chord first", () => {
    expect(suggested("bb-7", [])).toEqual(["<Bbm7>", "<Bbm7b5>"]);
  });

  it("completes halfway text", () => {
    expect(suggested("dsu", [])).toEqual(["<Dsus4>", "<Dsus2>"]);
  });

  it("matches on the text, so Am also matches Amaj7", () => {
    expect(suggested("Am", [])).toContain("<Amaj7>");
  });

  it("looks past a typed mark", () => {
    expect(suggested("(d", ["D"])[0]).toBe("D");
    expect(suggested("[ g7 ]", [])).toEqual(["<G7>", "<G7sus4>"]);
    expect(typedMark("(d")).toBe("held");
    expect(typedMark(" [G")).toBe("optional");
    expect(typedMark("d")).toBeUndefined();
  });

  it("completes the bass with the key's notes after a slash", () => {
    expect(suggested("d/", [])).toEqual([
      "<D/G>",
      "<D/A>",
      "<D/B>",
      "<D/C>",
      "<D/E>",
      "<D/F#>",
    ]);
    expect(suggested("d/f", [])).toEqual(["<D/F#>"]);
  });

  it("offers slash chords the sheet uses", () => {
    expect(suggested("", ["D/F#"], null)).toEqual(["D/F#"]);
  });

  it("has nothing without chords, key or text", () => {
    expect(suggested("", [], null)).toEqual([]);
  });

  it("completes only with canonical chords", () => {
    for (const { chord } of suggestChords("c", [], null)) {
      const written = writeChord(chord);
      expect(writeChord(readChord(written) ?? { root: "" })).toBe(written);
    }
  });
});
