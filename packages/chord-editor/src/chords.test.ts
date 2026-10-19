import { redo, undo } from "prosemirror-history";
import { describe, expect, it } from "vitest";

import { moveChord } from "./chords";
import { at, exec, idOf, notation, song, withCaret } from "./test-helpers";

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
