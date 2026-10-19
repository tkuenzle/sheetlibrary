import { redo, undo } from "prosemirror-history";
import { describe, expect, it } from "vitest";

import { changeChord, insertChord, removeChord } from "./chords";
import { chordsOn } from "./schema";
import {
  at,
  edit,
  exec,
  idOf,
  notation,
  song,
  type,
  withCaret,
} from "./test-helpers";

describe("chords as marks", () => {
  it("puts a pile of chords on one letter", () => {
    const state = song("[G7][C]grace");
    const first = state.doc.firstChild?.firstChild;
    expect(first?.text).toBe("g");
    expect(chordsOn(first).map((c) => c.chord)).toEqual(["G7", "C"]);
  });

  it("keeps chords off typed text next to them", () => {
    const state = song("A[D]m");
    const before = type(withCaret(state, at(state, "m")), "x");
    const after = type(withCaret(state, at(state, "m", 1)), "y");
    expect(notation(before)).toBe("Ax[D]m");
    expect(notation(after)).toBe("A[D]my");
  });
});

describe("chords are rescued", () => {
  it("moves to the start of the replacement when its letter is replaced", () => {
    const state = song("Amazing gr[D]ace");
    const next = edit(state, (tr) =>
      tr.insertText("ound", at(state, "ace"), at(state, "ace", 3)),
    );
    expect(notation(next)).toBe("Amazing gr[D]ound");
  });

  it("moves to the next letter when its letter is deleted", () => {
    const state = song("Am[D]azing");
    const next = edit(state, (tr) =>
      tr.delete(at(state, "azing"), at(state, "azing", 1)),
    );
    expect(notation(next)).toBe("Am[D]zing");
  });

  it("is removed when deleted on purpose", () => {
    const state = song("Am[D]azing");
    expect(notation(exec(state, removeChord(idOf(state, "D"))))).toBe(
      "Amazing",
    );
  });

  it("can be changed", () => {
    const state = song("Am[D]azing");
    const next = exec(state, changeChord(idOf(state, "D"), "D7"));
    expect(notation(next)).toBe("Am[D7]azing");
  });

  it("joins the chords already on a letter when added", () => {
    const state = song("[G]Amazing");
    const next = exec(state, insertChord(at(state, "A"), "D"));
    expect(notation(next)).toBe("[G][D]Amazing");
  });
});

describe("chords at the end of a line", () => {
  it("sit on a trailing space when added there", () => {
    const state = song("like me");
    const next = exec(state, insertChord(at(state, "me", 2), "D"));
    expect(notation(next)).toBe("like me[D] ");
  });

  it("sit on a trailing space when the rest of the line is deleted", () => {
    const state = song("Amazing gr[D]ace");
    const next = edit(state, (tr) =>
      tr.delete(at(state, " gr"), at(state, "ace", 3)),
    );
    expect(notation(next)).toBe("Amazing[D] ");
  });
});

describe("several chords on one letter", () => {
  it("keeps all rescued chords in order", () => {
    const state = song("[G]Amazing [C]grace [D]how [Em]sweet the sound");
    const next = edit(state, (tr) =>
      tr.delete(at(state, "grace"), at(state, "the")),
    );
    expect(notation(next)).toBe("[G]Amazing [C][D][Em]the sound");
  });

  it("puts rescued chords before chords that were already there", () => {
    const state = song("[G]Amazing [C]grace [D]the sound");
    const next = edit(state, (tr) =>
      tr.delete(at(state, "grace"), at(state, "the")),
    );
    expect(notation(next)).toBe("[G]Amazing [C][D]the sound");
  });
});

describe("deleting whole lines", () => {
  const text = "first\n[G]Amazing [C]grace\nlast";

  it("deletes the chords of a line deleted with its line break", () => {
    const state = song(text);
    const next = edit(state, (tr) =>
      tr.delete(at(state, "Amazing"), at(state, "last")),
    );
    expect(notation(next)).toBe("first\nlast");
  });

  it("deletes the chords of a line deleted from the line above", () => {
    const state = song(text);
    const next = edit(state, (tr) =>
      tr.delete(at(state, "first", 5), at(state, "grace", 5)),
    );
    expect(notation(next)).toBe("first\nlast");
  });

  it("keeps the chords when all text of a line is replaced", () => {
    const state = song(text);
    const next = edit(state, (tr) =>
      tr.insertText("Through", at(state, "Amazing"), at(state, "grace", 5)),
    );
    expect(notation(next)).toBe("first\n[G][C]Through\nlast");
  });

  it("rescues chords from partly deleted lines next to a deleted line", () => {
    const state = song("one [A]two\n[G]three\nfo[D]ur five");
    const next = edit(state, (tr) =>
      tr.delete(at(state, "two"), at(state, "ur")),
    );
    expect(notation(next)).toBe("one [A][D]ur five");
  });
});

describe("chords stay on their letters", () => {
  it("stays on its letter when text is typed before it", () => {
    const state = song("[D]Amazing");
    const next = edit(state, (tr) => tr.insertText("So ", at(state, "A")));
    expect(notation(next)).toBe("So [D]Amazing");
  });

  it("stays on its letter when text before it is deleted", () => {
    const state = song("Amazing [D]grace");
    const next = edit(state, (tr) =>
      tr.delete(at(state, "Amazing"), at(state, " grace")),
    );
    expect(notation(next)).toBe(" [D]grace");
  });

  it("moves to the new line with its word when the line is split", () => {
    const state = song("Amazing [G7]grace");
    const next = edit(state, (tr) => tr.split(at(state, "grace")));
    expect(notation(next)).toBe("Amazing \n[G7]grace");
  });

  it("stays on its letter when lines are joined", () => {
    const state = song("Amazing\n[G7]grace");
    const end = at(state, "Amazing", 7);
    const next = edit(state, (tr) => tr.delete(end, end + 2));
    expect(notation(next)).toBe("Amazing[G7]grace");
  });
});

describe("retyping a deleted letter", () => {
  it("leaves the chord on the next letter", () => {
    const state = song("Am[D]azing");
    const a = at(state, "azing");
    // Backspace on the "a", with the caret after it.
    const deleted = edit(withCaret(state, a + 1), (tr) => tr.delete(a, a + 1));
    expect(notation(type(deleted, "a"))).toBe("Ama[D]zing");
  });
});

describe("undo restores chords", () => {
  it("restores the letter and its chord in one step", () => {
    const state = song("Am[D]azing");
    const replaced = edit(state, (tr) =>
      tr.insertText("o", at(state, "azing"), at(state, "azing", 1)),
    );
    expect(notation(replaced)).toBe("Am[D]ozing");
    const undone = exec(replaced, undo);
    expect(undone.doc.eq(state.doc)).toBe(true);
  });

  it("repeats the edit and the rescue on redo", () => {
    const state = song("[G]Amazing [C]grace [D]how");
    const deleted = edit(state, (tr) =>
      tr.delete(at(state, "grace"), at(state, "how")),
    );
    const redone = exec(exec(deleted, undo), redo);
    expect(notation(redone)).toBe("[G]Amazing [C][D]how");
    expect(redone.doc.eq(deleted.doc)).toBe(true);
  });
});
