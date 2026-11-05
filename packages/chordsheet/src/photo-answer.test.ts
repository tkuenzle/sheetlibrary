import { describe, expect, it } from "vitest";

import { checkSheet } from "./check";
import { readPhotoAnswer } from "./photo-answer";
import { LABEL_MAX } from "./sheet";
import { labeled, line, section, sheet } from "./test-helpers";

function read(...lines: string[]) {
  return readPhotoAnswer(lines.join("\n"));
}

function content(...lines: string[]) {
  return read(...lines).content;
}

describe("Reading chords inline", () => {
  it("puts each chord on the text after it", () => {
    expect(content("A[D]mazing [G]grace")).toEqual(
      sheet(section(line("Amazing grace", [1, "D"], [8, "G"]))),
    );
  });

  it("puts a chord after a word before the space", () => {
    expect(content("grace[D7] how")).toEqual(
      sheet(section(line("grace how", [5, "D7"]))),
    );
  });

  it("puts a chord at the end after the last letter", () => {
    expect(content("me[D]")).toEqual(sheet(section(line("me", [2, "D"]))));
  });

  it("reads a line of chords only with a repeat count", () => {
    expect(content("[D] [A] [Bm] [G] x2")).toEqual(
      sheet(section(line("    x2", [0, "D"], [1, "A"], [2, "Bm"], [3, "G"]))),
    );
  });

  it("reads a line of chords only", () => {
    expect(content("[C] [G] [C]")).toEqual(
      sheet(section(line("  ", [0, "C"], [1, "G"], [2, "C"]))),
    );
  });

  it("reads held and optional chords", () => {
    expect(content("[(C)]Oh [[F]]yes")).toEqual(
      sheet(section(line("Oh yes", [0, "(C)"], [3, "[F]"]))),
    );
  });

  it("drops what isn't a chord and keeps the text around it", () => {
    expect(content("[N.C.]Hey [G]you []now")).toEqual(
      sheet(section(line("Hey you now", [4, "G"]))),
    );
  });

  it("keeps a bracket that is never closed as text", () => {
    expect(content("[G]Hey [you")).toEqual(
      sheet(section(line("Hey [you", [0, "G"]))),
    );
  });

  it("keeps chords in their canonical form", () => {
    expect(content("[Bb-7/F]Ah")).toEqual(
      sheet(section(line("Ah", [0, "Bbm7/F"]))),
    );
  });

  it("cleans up spaces as the editor does", () => {
    expect(content("  Amazing   [G]grace ")).toEqual(
      sheet(section(line("Amazing grace", [8, "G"]))),
    );
  });

  it("reads lyrics in NFC", () => {
    expect(content("Drüü")).toEqual(sheet(section(line("Drüü"))));
  });
});

describe("Reading sections", () => {
  it("starts a labeled section at each start directive", () => {
    expect(
      content(
        "{start_of_verse: Strophe 1}",
        "[G]Drüü Kö[D]nige",
        "us em Morgeland",
        "{end_of_verse}",
        "",
        "{start_of_chorus: Refrain}",
        "[C]Gloria",
        "{end_of_chorus}",
      ),
    ).toEqual(
      sheet(
        labeled(
          "Strophe 1",
          line("Drüü Könige", [0, "G"], [7, "D"]),
          line("us em Morgeland"),
        ),
        labeled("Refrain", line("Gloria", [0, "C"])),
      ),
    );
  });

  it("keeps a section whole across a blank line", () => {
    expect(
      content("{start_of_verse: Verse 1}", "One", "", "Two", "{end_of_verse}"),
    ).toEqual(sheet(labeled("Verse 1", line("One"), line("Two"))));
  });

  it("puts lines outside a section in a section without a label", () => {
    expect(
      content(
        "Before",
        "{start_of_part: Intro}",
        "[C] [G]",
        "{end_of_part}",
        "After",
        "",
        "Still after",
      ),
    ).toEqual(
      sheet(
        section(line("Before")),
        labeled("Intro", line(" ", [0, "C"], [1, "G"])),
        section(line("After"), line("Still after")),
      ),
    );
  });

  it("starts a section without a label when the directive has none", () => {
    expect(content("{start_of_verse}", "One", "{end_of_verse}")).toEqual(
      sheet(section(line("One"))),
    );
  });

  it("ends a section at the next start directive", () => {
    expect(
      content("{start_of_verse: A}", "One", "{start_of_verse: B}", "Two"),
    ).toEqual(sheet(labeled("A", line("One")), labeled("B", line("Two"))));
  });

  it("cleans up labels and cuts long ones to fit", () => {
    const long = "Strophe ".repeat(10);
    const { sections } = content(
      "{start_of_verse:   Verse   1 }",
      "One",
      `{start_of_verse: ${long}}`,
      "Two",
    );
    expect(sections[0]?.label).toBe("Verse 1");
    expect(sections[1]?.label?.length).toBeLessThanOrEqual(LABEL_MAX);
    expect(long.startsWith(sections[1]?.label ?? "-")).toBe(true);
  });

  it("drops a section left with no lines", () => {
    expect(
      content("{start_of_verse: Empty}", "", "{end_of_verse}", "One"),
    ).toEqual(sheet(section(line("One"))));
  });
});

describe("Dropping other directives", () => {
  it("drops comments and credits", () => {
    expect(
      content(
        "{composer: Paul Burkhard}",
        "{lyricist: A}",
        "{lyricist: B}",
        "{start_of_verse: Verse 1}",
        "[G]One",
        "{comment: D.S. al Coda}",
        "Two",
        "{end_of_verse}",
      ),
    ).toEqual(sheet(labeled("Verse 1", line("One", [0, "G"]), line("Two"))));
  });

  it("keeps braces inside a line as text", () => {
    expect(content("A {word} here")).toEqual(
      sheet(section(line("A {word} here"))),
    );
  });
});

describe("Reading the details", () => {
  it("reads the title and the artist", () => {
    const answer = read(
      "{title:  Drüü   Könige }",
      "{artist: Mani Matter}",
      "One",
    );
    expect(answer.title).toBe("Drüü Könige");
    expect(answer.artist).toBe("Mani Matter");
    expect(answer.content).toEqual(sheet(section(line("One"))));
  });

  it("leaves out details the answer doesn't have", () => {
    const answer = read("{title:   }", "One");
    expect(answer).toEqual({ content: sheet(section(line("One"))) });
  });
});

describe("Any text gives a valid sheet", () => {
  const answers = {
    "a full answer": [
      "{title: Es schneiet uf de Beerge scho}",
      "{composer: Volkslied}",
      "{start_of_part: Intro}",
      "[G] [D7] [G] x2",
      "{end_of_part}",
      "{start_of_verse: Strophe 1}",
      "Es [G]schneiet uf de [D7]Beerge scho,",
      "[(D7)]es schneit is [[C]]Tal [G]abe[D]",
      "{end_of_verse}",
    ],
    "only blank lines": ["", "  ", "\t", ""],
    "only directives": ["{title: X}", "{start_of_verse}", "{end_of_verse}"],
    "broken brackets": ["[[", "]]", "[[]]", "[ ]", "{", "}", "[G", "{x"],
    "chords and spaces": ["  [N.C.]  ", " [G]   [C] "],
  };

  for (const [name, lines] of Object.entries(answers)) {
    it(`for ${name}`, () => {
      expect(checkSheet(content(...lines))).toEqual([]);
    });
  }
});
