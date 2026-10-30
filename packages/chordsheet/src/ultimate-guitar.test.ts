import { describe, expect, it } from "vitest";

import { checkSheet } from "./check";
import { LABEL_MAX } from "./sheet";
import { labeled, line, section, sheet } from "./test-helpers";
import { readUltimateGuitar } from "./ultimate-guitar";

function read(...lines: string[]) {
  return readUltimateGuitar(lines.join("\n"));
}

describe("Reading Ultimate Guitar lines", () => {
  it("reads chords between bars", () => {
    expect(read("|G   |D   |Em  |C   |")).toEqual(
      sheet(section(line("   ", [0, "G"], [1, "D"], [2, "Em"], [3, "C"]))),
    );
  });

  it("drops N.C.", () => {
    expect(read("N.C.  G  (N.C.)  D")).toEqual(
      sheet(section(line(" ", [0, "G"], [1, "D"]))),
    );
  });

  it("keeps lyrics that start like chords", () => {
    expect(read("Am I wrong", "Forever rejoice")).toEqual(
      sheet(section(line("Am I wrong"), line("Forever rejoice"))),
    );
  });

  it("drops tab lines", () => {
    expect(
      read(
        "Here comes the riff",
        "e|-----3-----|",
        "B|---3---3---|",
        "G|-0-------0-|",
        "|--2--|",
      ),
    ).toEqual(sheet(section(line("Here comes the riff"))));
  });

  it("keeps other lines as lyrics", () => {
    expect(read("Capo: 2nd fret", "Key: G")).toEqual(
      sheet(section(line("Capo: 2nd fret"), line("Key: G"))),
    );
  });

  it("reads a word in brackets on a line as lyrics", () => {
    expect(read("Hello [Verse 1]")).toEqual(
      sheet(section(line("Hello [Verse 1]"))),
    );
  });
});

describe("Putting chords on the lyrics", () => {
  it("puts each chord on the letter under it", () => {
    expect(
      read("G                  D", "Amazing grace, how sweet the sound"),
    ).toEqual(
      sheet(
        section(
          line("Amazing grace, how sweet the sound", [0, "G"], [19, "D"]),
        ),
      ),
    );
  });

  it("puts chords on lyrics with wide gaps", () => {
    expect(
      read(
        "Eb   Eb/D  Eb/C   Eb/Bb  F/A        Bb",
        "And  the   great  est    miracle of all",
      ),
    ).toEqual(
      sheet(
        section(
          line(
            "And the great est miracle of all",
            [0, "Eb"],
            [4, "Eb/D"],
            [8, "Eb/C"],
            [14, "Eb/Bb"],
            [18, "F/A"],
            [29, "Bb"],
          ),
        ),
      ),
    );
  });

  it("counts wide letters as two columns", () => {
    expect(read("G        D/F#", "人算什麼 祢竟顧念他")).toEqual(
      sheet(section(line("人算什麼 祢竟顧念他", [0, "G"], [5, "D/F#"]))),
    );
  });

  it("puts a chord over the second half of a wide letter on that letter", () => {
    expect(read(" G D", "🎵 la")).toEqual(
      sheet(section(line("🎵 la", [0, "G"], [3, "D"]))),
    );
  });

  it("puts chords past the end after it, in order", () => {
    expect(read("G      C  D", "Grace")).toEqual(
      sheet(section(line("Grace ", [0, "G"], [5, "C"], [6, "D"]))),
    );
  });

  it("writes chords in their canonical form", () => {
    expect(read("Cmaj7  A-7", "Lalala la")).toEqual(
      sheet(section(line("Lalala la", [0, "Cmaj7"], [7, "Am7"]))),
    );
  });

  it("reads a line with an added #11 as chords", () => {
    expect(read("Fadd#11   F", "Lalala lala")).toEqual(
      sheet(section(line("Lalala lala", [0, "Fadd#11"], [10, "F"]))),
    );
  });

  it("makes a line of chords only, with its repeat count", () => {
    expect(read("[Intro]", "D A Bm G x2")).toEqual(
      sheet(
        labeled(
          "Intro",
          line("    x2", [0, "D"], [1, "A"], [2, "Bm"], [3, "G"]),
        ),
      ),
    );
  });

  it("makes a line of chords only above a header or a blank line", () => {
    expect(read("G  C", "[Verse 1]", "D", "", "Em")).toEqual(
      sheet(
        section(line(" ", [0, "G"], [1, "C"])),
        labeled("Verse 1", line("", [0, "D"])),
        section(line("", [0, "Em"])),
      ),
    );
  });

  it("drops the repeat count above lyrics", () => {
    expect(read("G   D  x2", "Hello you")).toEqual(
      sheet(section(line("Hello you", [0, "G"], [4, "D"]))),
    );
  });
});

describe("Chords in round brackets", () => {
  it("holds a chord that is the same as the one before, across sections", () => {
    expect(
      read(
        "[Verse]",
        "G       C",
        "Amazing grace",
        "[Chorus]",
        "(C)   D",
        "How sweet the sound",
      ),
    ).toEqual(
      sheet(
        labeled("Verse", line("Amazing grace", [0, "G"], [8, "C"])),
        labeled("Chorus", line("How sweet the sound", [0, "(C)"], [6, "D"])),
      ),
    );
  });

  it("makes a chord optional when the one before is another chord", () => {
    expect(read("G  (C)  D", "Amazing grace")).toEqual(
      sheet(section(line("Amazing grace", [0, "G"], [3, "[C]"], [8, "D"]))),
    );
    expect(read("C  (Cmaj7)", "Amazing grace")).toEqual(
      sheet(section(line("Amazing grace", [0, "C"], [3, "[Cmaj7]"]))),
    );
  });

  it("makes the first chord of the sheet optional", () => {
    expect(read("(Am)")).toEqual(sheet(section(line("", [0, "[Am]"]))));
  });

  it("still reads a repeat count in brackets", () => {
    expect(read("D A (x2)")).toEqual(
      sheet(section(line("  (x2)", [0, "D"], [1, "A"]))),
    );
  });

  it("reads brackets around something else as lyrics", () => {
    expect(read("(C D)", "(Hello)")).toEqual(
      sheet(section(line("(C D)"), line("(Hello)"))),
    );
  });
});

describe("Sections", () => {
  it("starts a labeled section at each header", () => {
    expect(read("[Verse 1]", "one", "two", "[Chorus]", "three")).toEqual(
      sheet(
        labeled("Verse 1", line("one"), line("two")),
        labeled("Chorus", line("three")),
      ),
    );
  });

  it("cuts a long label to fit", () => {
    const label = "Chorus ".repeat(10);
    const imported = read(`[${label}]`, "one");
    expect(imported.sections[0]?.label).toBe(
      label.slice(0, LABEL_MAX).trimEnd(),
    );
  });

  it("splits a section at a blank line", () => {
    expect(read("[Verse 1]", "one", "two", "", "three", "four")).toEqual(
      sheet(
        labeled("Verse 1", line("one"), line("two")),
        section(line("three"), line("four")),
      ),
    );
  });

  it("skips blank lines at the start of a section", () => {
    expect(read("", "[Verse 1]", "", "", "one", "", "", "two")).toEqual(
      sheet(labeled("Verse 1", line("one")), section(line("two"))),
    );
  });

  it("repeats a chorus for an empty header", () => {
    expect(
      read("[Chorus]", "one", "two", "[Verse 2]", "three", "", "[Chorus]"),
    ).toEqual(
      sheet(
        labeled("Chorus", line("one"), line("two")),
        labeled("Verse 2", line("three")),
        labeled("Chorus", line("one"), line("two")),
      ),
    );
  });

  it("repeats a chorus in two parts", () => {
    expect(
      read("[Chorus]", "one", "two", "", "three", "four", "[Chorus]"),
    ).toEqual(
      sheet(
        labeled("Chorus", line("one"), line("two")),
        section(line("three"), line("four")),
        labeled("Chorus", line("one"), line("two")),
        section(line("three"), line("four")),
      ),
    );
  });

  it("repeats the last chorus before the empty header", () => {
    expect(
      read(
        "[Chorus]",
        "one",
        "[Chorus]",
        "two",
        "[Chorus]",
        "[Outro]",
        "three",
      ),
    ).toEqual(
      sheet(
        labeled("Chorus", line("one")),
        labeled("Chorus", line("two")),
        labeled("Chorus", line("two")),
        labeled("Outro", line("three")),
      ),
    );
  });

  it("drops an empty header with nothing to repeat", () => {
    expect(read("[Intro]", "e|--3--|", "[Verse 1]", "one")).toEqual(
      sheet(labeled("Verse 1", line("one"))),
    );
  });

  it("cleans up the lines", () => {
    expect(read("  G", "  Amazing   grace  ")).toEqual(
      sheet(section(line("Amazing grace", [0, "G"]))),
    );
  });

  it("reads any line break", () => {
    expect(readUltimateGuitar("one\r\ntwo\rthree\n\nfour")).toEqual(
      sheet(
        section(line("one"), line("two"), line("three")),
        section(line("four")),
      ),
    );
  });
});

const amazingGrace = `Amazing Grace Chords by John Newton
Capo: 2nd fret
Key: G

[Intro]
|G   |C  G |G   |D   | x2

[Verse 1]
G                    G7         C        G
Amazing grace, how sweet the sound, that saved a wretch like me
G                    Em        D
I once was lost, but now am found

G         Em      D      G
Was blind, but now I see

[Solo]
e|-----3-----3-----|
B|---0---0---0-----|

[Verse 2]
G                 G7            C          G
'Twas grace that taught my heart to fear
G
And grace my fears relieved

[Solo]

[Outro]
G   C   G  N.C.
`;

describe("A whole sheet", () => {
  it("reads a sheet copied from Ultimate Guitar", () => {
    const read = readUltimateGuitar(amazingGrace);
    expect(checkSheet(read)).toEqual([]);
    expect(read.sections.map((s) => s.label)).toEqual([
      undefined,
      "Intro",
      "Verse 1",
      undefined,
      "Verse 2",
      "Outro",
    ]);
    expect(read.sections[1]).toEqual(
      labeled(
        "Intro",
        line("     x2", [0, "G"], [1, "C"], [2, "G"], [3, "G"], [4, "D"]),
      ),
    );
  });

  it.each([
    ["nothing", ""],
    ["blank lines", "\n  \n\t\n"],
    ["a recipe", "Pancakes\n\n2 eggs\n1 cup of flour\n\nMix well."],
    ["only headers", "[Verse]\n[Chorus]\n[]"],
    ["only chords", "A B C D E F G"],
    ["odd letters", "G\nété 🎵 x"],
  ])("gives a valid sheet for %s", (_, text) => {
    expect(checkSheet(readUltimateGuitar(text))).toEqual([]);
  });
});
