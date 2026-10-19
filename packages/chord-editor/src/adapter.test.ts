import type { Line, Section } from "chordsheet";
import { TextSelection } from "prosemirror-state";
import { describe, expect, it } from "vitest";

import { docFromSection, handBackSection } from "./adapter";
import { insertChord } from "./chords";
import { createEditorState } from "./editor";
import { chordsOn } from "./schema";
import { at, edit, exec, notation, type, withCaret } from "./test-helpers";

function section(...lines: Line[]): Section {
  return { lines };
}

// A line with chords given as [at, chord] pairs.
function line(text: string, ...chords: [number, string][]): Line {
  return { text, chords: chords.map(([at, chord]) => ({ at, chord })) };
}

function load(stored: Section) {
  return createEditorState(docFromSection(stored), { layer: false });
}

function handBack(state: ReturnType<typeof load>) {
  return handBackSection(state.doc);
}

describe("loading a section", () => {
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

  it("gives every chord its own id", () => {
    const state = load(section(line("grace", [0, "G"], [0, "G"], [2, "G"])));
    const ids: string[] = [];
    state.doc.descendants((node) => {
      ids.push(...chordsOn(node).map((chord) => chord.id));
    });
    expect(new Set(ids).size).toBe(3);
  });
});

describe("editing one section", () => {
  it("hands back an unchanged section as it was", () => {
    const stored = section(
      line("Amazing grace", [0, "G"], [8, "G7"], [8, "C"]),
      line("That saved a wretch like me", [27, "D"]),
      line("  ", [0, "G"], [1, "C"], [2, "D"]),
    );
    expect(handBack(load(stored))).toEqual({ ok: true, section: stored });
  });

  it("hands back a chord added after the last letter without the space", () => {
    const state = load(section(line("like me")));
    const next = exec(state, insertChord(at(state, "me", 2), "D"));
    expect(handBack(next)).toEqual({
      ok: true,
      section: section(line("like me", [7, "D"])),
    });
  });

  it("keeps a trailing space the user typed", () => {
    const state = load(section(line("like me")));
    const next = type(withCaret(state, at(state, "me", 2)), " ");
    expect(handBack(next)).toEqual({
      ok: true,
      section: section(line("like me ")),
    });
  });

  it("normalizes text to NFC and keeps chords in place", () => {
    const state = load(section(line("Café au lait", [6, "D"])));
    expect(handBack(state)).toEqual({
      ok: true,
      section: section(line("Café au lait", [5, "D"])),
    });
  });
});

describe("handing back a section", () => {
  it("drops empty lines", () => {
    const state = load(section(line("Amazing grace"), line("how sweet")));
    const next = edit(state, (tr) => tr.split(at(state, "grace", 5)));
    expect(notation(next)).toBe("Amazing grace\n\nhow sweet");
    expect(handBack(next)).toEqual({
      ok: true,
      section: section(line("Amazing grace"), line("how sweet")),
    });
  });

  it("hands back no section when nothing is left", () => {
    const state = load(
      section(line("Amazing grace", [8, "G"]), line("how sweet", [0, "C"])),
    );
    const all = state.apply(
      state.tr.setSelection(
        TextSelection.create(state.doc, 1, state.doc.content.size - 1),
      ),
    );
    const next = edit(all, (tr) => tr.deleteSelection());
    expect(handBack(next)).toEqual({ ok: true, section: undefined });
  });

  it("reports problems the clean-up can't fix", () => {
    const state = load(section(line("Amazing grace")));
    const next = exec(state, insertChord(at(state, "grace"), ""));
    const result = handBack(next);
    expect(result.ok).toBe(false);
  });
});
