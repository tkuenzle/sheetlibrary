import { redo, undo } from "prosemirror-history";
import { describe, expect, it } from "vitest";

import { transposeChord } from "chordsheet";

import {
  chordsIn,
  insertChord,
  moveChord,
  setChordsById,
  transposeChords,
} from "./chords";
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

describe("transposing", () => {
  const toA = transposeChords((c) =>
    transposeChord(
      c,
      { tonic: "G", minor: false },
      { tonic: "A", minor: false },
    ),
  );

  it("moves every chord and keeps the ids and the caret", () => {
    const state = withCaret(song("[G]Amazing [C]grace\n\n[D/F#]me"), 3);
    const ids = chordsIn(state.doc).map((c) => c.id);
    const next = exec(state, toA);
    expect(notation(next)).toBe("[A]Amazing [D]grace\n\n[E/G#]me");
    expect(chordsIn(next.doc).map((c) => c.id)).toEqual(ids);
    expect(next.selection.head).toBe(3);
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
});

describe("setting chords by id", () => {
  it("gives chords their parts back and skips ids that are gone", () => {
    const state = song("[G]Amazing [C]grace");
    const before = chordsIn(state.doc);
    const moved = exec(
      state,
      transposeChords((c) => ({ ...c, root: "A" })),
    );
    const next = exec(
      moved,
      setChordsById([...before.slice(0, 1), { id: "gone", root: "B" }]),
    );
    expect(notation(next)).toBe("[G]Amazing [A]grace");
  });
});
