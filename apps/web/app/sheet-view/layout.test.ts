import { describe, expect, it } from "vitest";

import {
  CHORD_SIZE,
  CHORD_SPACE,
  DASH_MIN,
  layoutLine,
  layoutSheet,
  type Piece,
} from "./layout";
import { line, sheet } from "./test-sheets";
import { lyricsFontWidths, widthOf } from "./widths";

function laidOut(source: string) {
  return layoutLine(line(source), lyricsFontWidths);
}

// A laid-out line as text: units between "|", chords in brackets before
// their piece's text, and "~" after a piece with a dash.
function notation(source: string) {
  return laidOut(source)
    .units.map((unit) =>
      unit
        .map(
          (piece) =>
            (piece.chords.length > 0 ? `[${piece.chords.join(" ")}]` : "") +
            piece.text +
            (piece.dash ? "~" : ""),
        )
        .join(""),
    )
    .join("|");
}

function chordedPieces(source: string) {
  return laidOut(source)
    .units.flat()
    .filter((piece) => piece.chords.length > 0);
}

// How wide a piece is drawn, in em, by the same rule as the CSS.
function drawnWidth(piece: Piece) {
  const names = piece.chords.reduce(
    (sum, name) =>
      sum + widthOf(name, 700, lyricsFontWidths) * CHORD_SIZE + CHORD_SPACE,
    0,
  );
  const text = widthOf(piece.text, 400, lyricsFontWidths);
  return Math.max(names, text, piece.minWidth ?? 0);
}

describe("layoutSheet", () => {
  it("keeps the sections and their labels", () => {
    const sections = layoutSheet(
      sheet(["Verse 1", "[G]Amazing grace"], [null, "how sweet"]),
      lyricsFontWidths,
    );
    expect(sections.map((section) => section.label)).toEqual(["Verse 1", null]);
    expect(sections[1]?.lines).toHaveLength(1);
  });
});

describe("layoutLine", () => {
  it("runs a chord's piece to the next chord when there's room", () => {
    expect(notation("[G]Amazing [G7]grace")).toBe("[G]Amazing |[G7]grace");
    expect(chordedPieces("[G]Amazing [G7]grace")[0]?.minWidth).toBeUndefined();
  });

  it("keeps a short word with its wide chord, up to the next chord", () => {
    expect(notation("[Am7]I [G]love you")).toBe("[Am7]I |[G]love |you");
  });

  it("ends a long stretch at the first space past the chord's name", () => {
    expect(notation("[G]Amazing grace how sweet")).toBe(
      "[G]Amazing |grace |how |sweet",
    );
    // "a little" is narrower than "F#m7b5", so "more" stays in the piece.
    expect(notation("[F#m7b5]a little more than words")).toBe(
      "[F#m7b5]a little more |than |words",
    );
  });

  it("splits text without chords into words", () => {
    expect(notation("That saved a wretch")).toBe("That |saved |a |wretch");
    expect(laidOut("That saved").chordsOnly).toBe(false);
  });

  it("gives a pile one letter, with a dash inside a word", () => {
    expect(notation("A[Am7][G]men")).toBe("A[Am7 G]m~en");
    expect(notation("[G][C]Amazing grace")).toBe("[G C]A~mazing |grace");
  });

  it("gives a chord on a space the space alone", () => {
    expect(notation("grace,[C] how sweet")).toBe("grace,[C] |how |sweet");
  });

  it("gives a chord at the end of a line no text", () => {
    expect(notation("now I [G]see[D]")).toBe("now |I |[G]see[D]");
  });

  it("marks a line of chords only", () => {
    const only = laidOut("[G][C][D][G]");
    expect(only.chordsOnly).toBe(true);
    expect(only.units).toEqual([
      [{ chords: ["G", "C", "D", "G"], text: "", dash: false }],
    ]);
  });

  it("writes chords with their marks", () => {
    expect(notation("[(G)]Amazing")).toBe("[(G)]Amazing");
  });
});

describe("dashes", () => {
  it("gives tight chords inside a word a dash with room to show", () => {
    const [f, am] = chordedPieces("Hal[F]le[Am]lu[F]jah");
    for (const piece of [f, am]) {
      expect(piece?.dash).toBe(true);
      if (!piece) continue;
      expect(drawnWidth(piece)).toBeGreaterThanOrEqual(
        widthOf(piece.text, 400, lyricsFontWidths) + DASH_MIN - 0.001,
      );
    }
  });

  it("gives a chord inside a word with room no dash", () => {
    const [em] = chordedPieces("won[Em]derful[D]ly");
    expect(em).toEqual({ chords: ["Em"], text: "derful", dash: false });
  });

  it("gives no dash at the end of a word", () => {
    const [g] = chordedPieces("[Am7]I [G]love");
    expect(g?.dash).toBe(false);
  });
});
