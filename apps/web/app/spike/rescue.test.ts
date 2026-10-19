import { redo, undo } from "prosemirror-history";
import { describe, expect, it } from "vitest";

import {
  findChord,
  insertChord,
  moveChord,
  removeChord,
  renameChord,
} from "./chords";
import { docFromChordPro, docToChordPro } from "./chordpro";
import { chordsOn } from "./schema";
import {
  at,
  chordPro,
  edit,
  exec,
  song,
  type,
  withCaret,
} from "./test-helpers";

describe("chords as marks", () => {
  it("reads and writes ChordPro", () => {
    const text = "[G]Amazing [G7][C]grace\nlike [D]me[A7]";
    expect(docToChordPro(docFromChordPro(text))).toBe(
      "[G]Amazing [G7][C]grace\nlike [D]me[A7] ",
    );
  });

  it("puts a pile of chords on one letter", () => {
    const state = song("[G7][C]grace");
    const first = state.doc.firstChild?.firstChild;
    expect(first?.text).toBe("g");
    expect(chordsOn(first).map((c) => c.name)).toEqual(["G7", "C"]);
  });

  it("keeps chords off typed text next to them", () => {
    const state = song("A[D]m");
    const before = type(withCaret(state, at(state, "m")), "x");
    const after = type(withCaret(state, at(state, "m", 1)), "y");
    expect(chordPro(before)).toBe("Ax[D]m");
    expect(chordPro(after)).toBe("A[D]my");
  });
});

describe("chords are rescued", () => {
  it("moves to the start of the replacement when its letter is replaced", () => {
    const state = song("Amazing gr[D]ace");
    const next = edit(state, (tr) =>
      tr.insertText("ound", at(state, "ace"), at(state, "ace", 3)),
    );
    expect(chordPro(next)).toBe("Amazing gr[D]ound");
  });

  it("moves to the next letter when its letter is deleted", () => {
    const state = song("Am[D]azing");
    const next = edit(state, (tr) =>
      tr.delete(at(state, "azing"), at(state, "azing", 1)),
    );
    expect(chordPro(next)).toBe("Am[D]zing");
  });

  it("is removed when deleted on purpose", () => {
    const state = song("Am[D]azing");
    expect(chordPro(exec(state, removeChord(idOf(state, "D"))))).toBe(
      "Amazing",
    );
  });

  it("keeps its identity when moved", () => {
    const state = song("Am[D]azing");
    const id = idOf(state, "D");
    const next = exec(state, moveChord(id, at(state, "zing")));
    expect(chordPro(next)).toBe("Ama[D]zing");
    expect(findChord(next.doc, id)).not.toBeNull();
  });

  it("can be renamed", () => {
    const state = song("Am[D]azing");
    const next = exec(state, renameChord(idOf(state, "D"), "D7"));
    expect(chordPro(next)).toBe("Am[D7]azing");
  });

  it("joins the chords already on a letter when added", () => {
    const state = song("[G]Amazing");
    const next = exec(state, insertChord(at(state, "A"), "D"));
    expect(chordPro(next)).toBe("[G][D]Amazing");
  });
});

describe("chords at the end of a line", () => {
  it("sit on a trailing space when added there", () => {
    const state = song("like me");
    const next = exec(state, insertChord(at(state, "me", 2), "D"));
    expect(chordPro(next)).toBe("like me[D] ");
  });

  it("sit on a trailing space when the rest of the line is deleted", () => {
    const state = song("Amazing gr[D]ace");
    const next = edit(state, (tr) =>
      tr.delete(at(state, " gr"), at(state, "ace", 3)),
    );
    expect(chordPro(next)).toBe("Amazing[D] ");
  });
});

describe("several chords on one letter", () => {
  it("keeps all rescued chords in order", () => {
    const state = song("[G]Amazing [C]grace [D]how [Em]sweet the sound");
    const next = edit(state, (tr) =>
      tr.delete(at(state, "grace"), at(state, "the")),
    );
    expect(chordPro(next)).toBe("[G]Amazing [C][D][Em]the sound");
  });

  it("puts rescued chords before chords that were already there", () => {
    const state = song("[G]Amazing [C]grace [D]the sound");
    const next = edit(state, (tr) =>
      tr.delete(at(state, "grace"), at(state, "the")),
    );
    expect(chordPro(next)).toBe("[G]Amazing [C][D]the sound");
  });
});

describe("deleting whole lines", () => {
  const text = "first\n[G]Amazing [C]grace\nlast";

  it("deletes the chords of a line deleted with its line break", () => {
    const state = song(text);
    const next = edit(state, (tr) =>
      tr.delete(at(state, "Amazing"), at(state, "last")),
    );
    expect(chordPro(next)).toBe("first\nlast");
  });

  it("deletes the chords of a line deleted from the line above", () => {
    const state = song(text);
    const next = edit(state, (tr) =>
      tr.delete(at(state, "first", 5), at(state, "grace", 5)),
    );
    expect(chordPro(next)).toBe("first\nlast");
  });

  it("keeps the chords when all text of a line is replaced", () => {
    const state = song(text);
    const next = edit(state, (tr) =>
      tr.insertText("Through", at(state, "Amazing"), at(state, "grace", 5)),
    );
    expect(chordPro(next)).toBe("first\n[G][C]Through\nlast");
  });

  it("rescues chords from partly deleted lines next to a deleted line", () => {
    const state = song("one [A]two\n[G]three\nfo[D]ur five");
    const next = edit(state, (tr) =>
      tr.delete(at(state, "two"), at(state, "ur")),
    );
    expect(chordPro(next)).toBe("one [A][D]ur five");
  });
});

describe("chords stay on their letters", () => {
  it("stays on its letter when text is typed before it", () => {
    const state = song("[D]Amazing");
    const next = edit(state, (tr) => tr.insertText("So ", at(state, "A")));
    expect(chordPro(next)).toBe("So [D]Amazing");
  });

  it("stays on its letter when text before it is deleted", () => {
    const state = song("Amazing [D]grace");
    const next = edit(state, (tr) =>
      tr.delete(at(state, "Amazing"), at(state, " grace")),
    );
    expect(chordPro(next)).toBe(" [D]grace");
  });

  it("moves to the new line with its word when the line is split", () => {
    const state = song("Amazing [G7]grace");
    const next = edit(state, (tr) => tr.split(at(state, "grace")));
    expect(chordPro(next)).toBe("Amazing \n[G7]grace");
  });

  it("stays on its letter when lines are joined", () => {
    const state = song("Amazing\n[G7]grace");
    const end = at(state, "Amazing", 7);
    const next = edit(state, (tr) => tr.delete(end, end + 2));
    expect(chordPro(next)).toBe("Amazing[G7]grace");
  });
});

describe("retyping a deleted letter", () => {
  it("leaves the chord on the next letter", () => {
    const state = song("Am[D]azing");
    const a = at(state, "azing");
    // Backspace on the "a", with the caret after it.
    const deleted = edit(withCaret(state, a + 1), (tr) => tr.delete(a, a + 1));
    expect(chordPro(type(deleted, "a"))).toBe("Ama[D]zing");
  });
});

describe("undo restores chords", () => {
  it("restores the letter and its chord in one step", () => {
    const state = song("Am[D]azing");
    const replaced = edit(state, (tr) =>
      tr.insertText("o", at(state, "azing"), at(state, "azing", 1)),
    );
    expect(chordPro(replaced)).toBe("Am[D]ozing");
    const undone = exec(replaced, undo);
    expect(undone.doc.eq(state.doc)).toBe(true);
  });

  it("repeats the edit and the rescue on redo", () => {
    const state = song("[G]Amazing [C]grace [D]how");
    const deleted = edit(state, (tr) =>
      tr.delete(at(state, "grace"), at(state, "how")),
    );
    const redone = exec(exec(deleted, undo), redo);
    expect(chordPro(redone)).toBe("[G]Amazing [C][D]how");
    expect(redone.doc.eq(deleted.doc)).toBe(true);
  });
});

function idOf(state: ReturnType<typeof song>, name: string) {
  let id: string | undefined;
  state.doc.descendants((node) => {
    id ??= chordsOn(node).find((chord) => chord.name === name)?.id;
  });
  if (!id) throw new Error(`chord ${name} not found`);
  return id;
}
