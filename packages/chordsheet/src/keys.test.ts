import { describe, expect, it } from "vitest";

import { writeMarkedChord } from "./chord-mark";
import {
  guessKey,
  type Key,
  keysToMoveTo,
  transposeChord,
  stepKey,
} from "./keys";
import { read } from "./test-helpers";

const major = (tonic: string): Key => ({ tonic, minor: false });
const minor = (tonic: string): Key => ({ tonic, minor: true });

// Chords given as text, in order.
function chords(...texts: string[]) {
  return texts.map(read);
}

// Moves chords given as text, and writes them back.
function moved(from: Key, to: Key, ...texts: string[]): string[] {
  return chords(...texts).map((chord) =>
    writeMarkedChord(transposeChord(chord, from, to)),
  );
}

// "Amazing Grace" (public domain), the chords of its first verse.
const amazingGrace = [
  "G",
  "G7",
  "C",
  "G",
  "D",
  "G",
  "G7",
  "C",
  "G",
  "Em",
  "D",
  "G",
];
// "Greensleeves" (traditional), the chords of its first verse.
const greensleeves = [
  "Em",
  "G",
  "D",
  "Bm",
  "Em",
  "C",
  "B7",
  "Em",
  "G",
  "D",
  "Bm",
  "Em",
  "B7",
  "Em",
];

describe("Keys to move to", () => {
  it("lists major keys with the fewer accidentals, and both at the tie", () => {
    expect(keysToMoveTo(false).map((cell) => cell.map((k) => k.tonic))).toEqual(
      [
        ["C"],
        ["Db"],
        ["D"],
        ["Eb"],
        ["E"],
        ["F"],
        ["F#", "Gb"],
        ["G"],
        ["Ab"],
        ["A"],
        ["Bb"],
        ["B"],
      ],
    );
  });

  it("lists minor keys with their own spellings", () => {
    const cells = keysToMoveTo(true);
    expect(cells.map((cell) => cell.map((k) => k.tonic))).toEqual([
      ["C"],
      ["C#"],
      ["D"],
      ["D#", "Eb"],
      ["E"],
      ["F"],
      ["F#"],
      ["G"],
      ["G#"],
      ["A"],
      ["Bb"],
      ["B"],
    ]);
    expect(cells.flat().every((k) => k.minor)).toBe(true);
  });
});

describe("Moving chords to a key", () => {
  it("spells chords in a flat key with flats", () => {
    expect(moved(major("G"), major("Bb"), "G", "Cmaj7", "D", "Em")).toEqual([
      "Bb",
      "Ebmaj7",
      "F",
      "Gm",
    ]);
  });

  it("moves the bass too", () => {
    expect(moved(major("G"), major("A"), "G/B")).toEqual(["A/C#"]);
  });

  it("keeps a chord outside the key in its place in the key", () => {
    // F is the flat seventh in G, and G in A.
    expect(moved(major("G"), major("A"), "F")).toEqual(["G"]);
  });

  it("keeps the mark", () => {
    expect(moved(major("G"), major("A"), "(C)", "[D7]")).toEqual([
      "(D)",
      "[E7]",
    ]);
  });

  it("spells sharp keys with sharps", () => {
    expect(moved(major("C"), major("F#"), "C", "F", "G", "Am", "Bdim")).toEqual(
      ["F#", "B", "C#", "D#m", "E#dim"],
    );
  });
});

describe("Stepping by a semitone", () => {
  it("lands on the listed key", () => {
    expect(stepKey(major("G"), 1)).toEqual(major("Ab"));
    expect(stepKey(major("C"), 1)).toEqual(major("Db"));
    expect(stepKey(minor("Bb"), -1)).toEqual(minor("A"));
  });

  it("lands on F# and Ebm at the tie", () => {
    expect(stepKey(major("G"), -1)).toEqual(major("F#"));
    expect(stepKey(major("F"), 1)).toEqual(major("F#"));
    expect(stepKey(minor("E"), -1)).toEqual(minor("Eb"));
    expect(stepKey(minor("D"), 1)).toEqual(minor("Eb"));
  });
});

describe("Respelling", () => {
  it("respells G# as Ab without moving it", () => {
    expect(moved(major("G#"), major("Ab"), "G#", "C#", "D#", "Fm")).toEqual([
      "Ab",
      "Db",
      "Eb",
      "Fm",
    ]);
  });
});

describe("Guessing the key", () => {
  it("guesses a major sheet", () => {
    expect(guessKey(chords(...amazingGrace))).toEqual(major("G"));
  });

  it("keeps the sheet's spelling", () => {
    const inGSharp = moved(major("G"), major("G#"), ...amazingGrace);
    expect(inGSharp).toContain("C#");
    expect(guessKey(chords(...inGSharp))).toEqual(major("G#"));
  });

  it("guesses a minor sheet", () => {
    expect(guessKey(chords(...greensleeves))).toEqual(minor("E"));
  });

  it("guesses G for G, C and D", () => {
    expect(guessKey(chords("G", "C", "D", "G"))).toEqual(major("G"));
    expect(guessKey(chords("C", "G", "D"))).toEqual(major("G"));
  });

  it("moves the guess with the sheet", () => {
    for (const to of keysToMoveTo(false).flat()) {
      const sheet = moved(major("G"), to, ...amazingGrace);
      expect(guessKey(chords(...sheet))).toEqual(to);
    }
    for (const to of keysToMoveTo(true).flat()) {
      const sheet = moved(minor("E"), to, ...greensleeves);
      expect(guessKey(chords(...sheet))).toEqual(to);
    }
  });

  it("counts held and optional chords", () => {
    expect(guessKey(chords("(G)", "[C]", "(D)"))).toEqual(major("G"));
  });

  it("has no key without chords", () => {
    expect(guessKey([])).toBeNull();
  });
});
