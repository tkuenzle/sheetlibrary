import type { ChordSheet, Line, Section } from "chordsheet";
import { describe, expect, it } from "vitest";

import { docFromSheet, handBackSheet } from "./adapter";
import { insertChord, moveChord } from "./chords";
import { createEditorState } from "./editor";
import { chordsOn } from "./schema";
import {
  at,
  edit,
  exec,
  idOf,
  notation,
  type,
  withCaret,
} from "./test-helpers";

function sheet(...sections: Section[]): ChordSheet {
  return { format: "chordsheet", version: 1, sections };
}

function section(...lines: Line[]): Section {
  return { lines };
}

// A line with chords given as [at, chord] pairs.
function line(text: string, ...chords: [number, string][]): Line {
  return { text, chords: chords.map(([at, chord]) => ({ at, chord })) };
}

function load(stored: Section | ChordSheet) {
  const content = "lines" in stored ? sheet(stored) : stored;
  return createEditorState(docFromSheet(content), { layer: false });
}

function handBack(state: ReturnType<typeof load>) {
  return handBackSheet(state.doc);
}

// The result of handing back a sheet with these sections.
function handedBack(...sections: Section[]) {
  return { ok: true, sheet: sheet(...sections) };
}

describe("loading a sheet", () => {
  it("puts each chord on its letter", () => {
    const state = load(
      section(line("Amazing grace", [0, "G"], [8, "G7"]), line("how sweet")),
    );
    expect(notation(state)).toBe("[G]Amazing [G7]grace\nhow sweet");
  });

  it("keeps a pile in order", () => {
    const state = load(section(line("grace", [0, "G7"], [0, "C"])));
    expect(notation(state)).toBe("[G7][C]grace");
  });

  it("puts chords after the last letter on a trailing space", () => {
    const state = load(section(line("like me", [5, "D"], [7, "A7"])));
    expect(notation(state)).toBe("like [D]me[A7] ");
  });

  it("puts each section in its own section", () => {
    const state = load(
      sheet(
        section(line("Amazing grace"), line("how sweet")),
        section(line("I once")),
      ),
    );
    expect(notation(state)).toBe("Amazing grace\nhow sweet\n\nI once");
  });

  it("loads a sheet without sections as one empty section", () => {
    expect(notation(load(sheet()))).toBe("~");
  });

  it("gives every chord its own id", () => {
    const state = load(section(line("grace", [0, "G"], [0, "G"], [2, "G"])));
    const ids: string[] = [];
    state.doc.descendants((node) => {
      ids.push(...chordsOn(node).map((chord) => chord.id));
    });
    expect(new Set(ids).size).toBe(3);
  });
});

describe("editing a sheet", () => {
  it("hands back an unchanged sheet as it was", () => {
    const stored = sheet(
      section(
        line("Amazing grace", [0, "G"], [8, "G7"], [8, "C"]),
        line("That saved a wretch like me", [27, "D"]),
      ),
      section(line("  ", [0, "G"], [1, "C"], [2, "D"])),
    );
    expect(handBack(load(stored))).toEqual({ ok: true, sheet: stored });
  });

  it("hands back labels as they were", () => {
    const stored = sheet(
      { label: "Chorus", lines: [line("Amazing grace", [0, "G"])] },
      section(line("like me", [7, "D"])),
    );
    const state = load(stored);
    expect(notation(state)).toBe("# Chorus\n[G]Amazing grace\n\nlike me[D] ");
    expect(handBack(state)).toEqual({ ok: true, sheet: stored });
  });

  it("hands back a chord added after the last letter without the space", () => {
    const state = load(section(line("like me")));
    const next = exec(state, insertChord(at(state, "me", 2), "D"));
    expect(handBack(next)).toEqual(
      handedBack(section(line("like me", [7, "D"]))),
    );
  });

  it("trims spaces the user typed at both ends of a line", () => {
    const state = load(section(line("like me", [5, "D"])));
    const typed = type(withCaret(state, at(state, "me", 2)), " ");
    const next = type(withCaret(typed, at(typed, "like")), "  ");
    expect(handBack(next)).toEqual(
      handedBack(section(line("like me", [5, "D"]))),
    );
  });

  it("hands back no trailing space after a chord moves off the end", () => {
    const state = load(section(line("like me", [7, "D"])));
    const next = exec(state, moveChord(idOf(state, "D"), at(state, "me")));
    expect(handBack(next)).toEqual(
      handedBack(section(line("like me", [5, "D"]))),
    );
  });

  it("keeps spaces with chords", () => {
    const stored = sheet(section(line(" like me", [0, "G"], [8, "D"])));
    expect(handBack(load(stored))).toEqual({ ok: true, sheet: stored });
  });

  it("normalizes text to NFC and keeps chords in place", () => {
    const state = load(section(line("Café au lait", [6, "D"])));
    expect(handBack(state)).toEqual(
      handedBack(section(line("Café au lait", [5, "D"]))),
    );
  });
});

describe("handing back a sheet", () => {
  it("drops empty lines", () => {
    const state = load(section(line("Amazing grace"), line("how sweet")));
    const next = edit(state, (tr) => tr.split(at(state, "grace", 5)));
    expect(notation(next)).toBe("Amazing grace\n~\nhow sweet");
    expect(handBack(next)).toEqual(
      handedBack(section(line("Amazing grace"), line("how sweet"))),
    );
  });

  it("drops sections with nothing left", () => {
    const state = load(
      sheet(
        section(line("Amazing grace")),
        section(line("how sweet", [0, "C"])),
      ),
    );
    const first = state.doc.child(0);
    const next = edit(state, (tr) =>
      tr.delete(2, 2 + first.child(0).content.size),
    );
    expect(notation(next)).toBe("~\n\n[C]how sweet");
    expect(handBack(next)).toEqual(
      handedBack(section(line("how sweet", [0, "C"]))),
    );
  });

  it("hands back no sections when nothing is left", () => {
    const state = load(section(line("Amazing grace")));
    const next = edit(state, (tr) =>
      tr.delete(2, 2 + state.doc.child(0).child(0).content.size),
    );
    expect(handBack(next)).toEqual(handedBack());
  });

  it("reports problems the clean-up can't fix", () => {
    const state = load(section(line("Amazing grace")));
    const next = exec(state, insertChord(at(state, "grace"), ""));
    const result = handBack(next);
    expect(result.ok).toBe(false);
  });
});
