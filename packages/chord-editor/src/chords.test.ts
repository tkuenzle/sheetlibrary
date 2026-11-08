import { redo, undo } from "prosemirror-history";
import { describe, expect, it } from "vitest";

import { transposeChord } from "chordsheet";

import {
  chordsIn,
  insertChord,
  moveChord,
  setKey,
  transposeChords,
} from "./chords";
import { keyOf, originalKeyOf } from "./schema";
import {
  at,
  chord,
  exec,
  idOf,
  notation,
  song,
  withCaret,
} from "./test-helpers";

describe("adding a chord", () => {
  it("puts it after the chords on a letter", () => {
    const state = song("[G]grace");
    const next = exec(state, insertChord(at(state, "grace"), chord("C")));
    expect(notation(next)).toBe("[G][C]grace");
  });

  it("keeps the caret before the space it adds at the end of a line", () => {
    const state = song("Amazing grace");
    const end = at(state, "grace", 5);
    const next = exec(withCaret(state, end), insertChord(end, chord("D")));
    expect(notation(next)).toBe("Amazing grace[D] ");
    expect(next.selection.head).toBe(end);
  });
});

describe("moving a chord", () => {
  it("puts it after the chords on another letter", () => {
    const state = song("[G]Amazing [C]grace");
    const next = exec(state, moveChord(idOf(state, "G"), at(state, "grace")));
    expect(notation(next)).toBe("Amazing [C][G]grace");
  });

  it("keeps its mark", () => {
    const state = song("[(G)]Amazing [C]grace");
    const next = exec(state, moveChord(idOf(state, "(G)"), at(state, "grace")));
    expect(notation(next)).toBe("Amazing [C][(G)]grace");
  });

  it("puts it at a spot in a pile", () => {
    const state = song("[D]Amazing [G][C]grace");
    const next = exec(
      state,
      moveChord(idOf(state, "D"), at(state, "grace"), 1),
    );
    expect(notation(next)).toBe("Amazing [G][D][C]grace");
  });

  it("reorders a pile on its own letter", () => {
    const state = song("[G][C][Em]grace");
    const pos = at(state, "grace");
    expect(notation(exec(state, moveChord(idOf(state, "Em"), pos, 1)))).toBe(
      "[G][Em][C]grace",
    );
    expect(notation(exec(state, moveChord(idOf(state, "G"), pos)))).toBe(
      "[C][Em][G]grace",
    );
  });

  it("moves it to the end of a line", () => {
    const state = song("[G]Amazing grace");
    const end = at(state, "grace", 5);
    const next = exec(withCaret(state, end), moveChord(idOf(state, "G"), end));
    expect(notation(next)).toBe("Amazing grace[G] ");
    expect(next.selection.head).toBe(end);
  });

  it("keeps the caret where it was", () => {
    const state = withCaret(song("[G]Amazing grace"), 3);
    const next = exec(state, moveChord(idOf(state, "G"), at(state, "grace")));
    expect(next.selection.head).toBe(3);
  });

  it("changes nothing when moved to where it is", () => {
    const state = song("[G][C]grace");
    const pos = at(state, "grace");
    const command = moveChord(idOf(state, "C"), pos);
    expect(command(state, () => expect.fail("dispatched"))).toBe(true);
  });

  it("is undone and redone in one step", () => {
    const state = song("[G]Amazing grace");
    const moved = exec(state, moveChord(idOf(state, "G"), at(state, "grace")));
    const undone = exec(moved, undo);
    expect(notation(undone)).toBe("[G]Amazing grace");
    expect(notation(exec(undone, redo))).toBe("Amazing [G]grace");
  });
});

const G = { tonic: "G", minor: false };
const A = { tonic: "A", minor: false };
const Em = { tonic: "E", minor: true };

describe("transposing", () => {
  const toA = transposeChords((c) => transposeChord(c, G, A), A);

  it("moves every chord and keeps the ids and the caret", () => {
    const state = withCaret(song("[G]Amazing [C]grace\n\n[D/F#]me"), 3);
    const ids = chordsIn(state.doc).map((c) => c.id);
    const next = exec(state, toA);
    expect(notation(next)).toBe("[A]Amazing [D]grace\n\n[E/G#]me");
    expect(chordsIn(next.doc).map((c) => c.id)).toEqual(ids);
    expect(next.selection.head).toBe(3);
  });

  it("keeps marks", () => {
    const state = song("[G]Amazing [(G)]grace");
    expect(notation(exec(state, toA))).toBe("[A]Amazing [(A)]grace");
  });

  it("is undone in one step", () => {
    const state = song("[G]Amazing [C]grace\n\n[D]me");
    expect(notation(exec(exec(state, toA), undo))).toBe(
      "[G]Amazing [C]grace\n\n[D]me",
    );
  });

  it("changes nothing in a sheet without chords", () => {
    const state = song("Amazing grace");
    expect(exec(state, toA).doc.eq(state.doc)).toBe(true);
  });

  it("moves a set key with the chords, in one step", () => {
    const state = exec(song("[G]Amazing [C]grace"), setKey(G));
    const next = exec(state, toA);
    expect(notation(next)).toBe("[A]Amazing [D]grace");
    expect(keyOf(next.doc)).toEqual(A);
    expect(originalKeyOf(next.doc)).toEqual(G);
    const undone = exec(next, undo);
    expect(notation(undone)).toBe("[G]Amazing [C]grace");
    expect(keyOf(undone.doc)).toEqual(G);
  });

  it("sets no key when none is set", () => {
    expect(keyOf(exec(song("[G]Amazing grace"), toA).doc)).toBeNull();
  });
});

describe("setting the key", () => {
  it("moves no chord", () => {
    const state = song("[G]Amazing [C]grace\n\n[D]me");
    const next = exec(state, setKey(Em));
    expect(keyOf(next.doc)).toEqual(Em);
    expect(originalKeyOf(next.doc)).toEqual(Em);
    expect(notation(next)).toBe(notation(state));
    expect(chordsIn(next.doc)).toEqual(chordsIn(state.doc));
  });

  it("is undone in one step", () => {
    const state = exec(song("[G]Amazing grace"), setKey(G));
    const undone = exec(exec(state, setKey(Em)), undo);
    expect(keyOf(undone.doc)).toEqual(G);
    expect(originalKeyOf(undone.doc)).toEqual(G);
    const redone = exec(undone, redo);
    expect(keyOf(redone.doc)).toEqual(Em);
    expect(originalKeyOf(redone.doc)).toEqual(Em);
  });

  it("changes nothing when the key is already set", () => {
    const state = exec(song("[G]Amazing grace"), setKey(G));
    expect(exec(state, setKey({ ...G })).doc).toBe(state.doc);
  });
});
