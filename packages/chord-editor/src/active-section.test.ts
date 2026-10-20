import { redo, undo } from "prosemirror-history";
import { AllSelection, TextSelection } from "prosemirror-state";
import { describe, expect, it } from "vitest";

import { endEditing, getActiveSection, startEditing } from "./active-section";
import { moveChord } from "./chords";
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

// A sheet with the caret before `needle`, being edited.
function editing(text: string, needle: string) {
  const state = song(text);
  return exec(withCaret(state, at(state, needle)), startEditing);
}

// The text of the active section's first line.
function active(state: ReturnType<typeof song>) {
  const pos = getActiveSection(state);
  return pos === null ? null : state.doc.nodeAt(pos)?.firstChild?.textContent;
}

describe("active section", () => {
  it("is none until editing starts", () => {
    const state = song("one\n\ntwo");
    expect(active(state)).toBe(null);
    expect(active(exec(withCaret(state, at(state, "two")), startEditing))).toBe(
      "two",
    );
  });

  it("follows the caret into another section", () => {
    const state = editing("one\n\ntwo", "one");
    expect(active(state)).toBe("one");
    expect(active(withCaret(state, at(state, "two")))).toBe("two");
  });

  it("is none after editing ends", () => {
    const state = editing("one\n\ntwo", "one");
    expect(active(exec(state, endEditing))).toBe(null);
  });
});

describe("selection across sections", () => {
  it("ends at the end of the section where it starts", () => {
    const state = editing("one\nmore\n\ntwo", "one");
    const next = state.apply(
      state.tr.setSelection(
        TextSelection.create(state.doc, at(state, "one"), at(state, "two", 2)),
      ),
    );
    expect(next.selection.from).toBe(at(state, "one"));
    expect(next.selection.to).toBe(at(state, "more", 4));
    expect(active(next)).toBe("one");
  });

  it("ends at the start of the section where it starts when going back", () => {
    const state = editing("one\n\ntwo\nmore", "more");
    const next = state.apply(
      state.tr.setSelection(
        TextSelection.create(state.doc, at(state, "more", 2), at(state, "one")),
      ),
    );
    expect(next.selection.from).toBe(at(state, "two"));
    expect(next.selection.to).toBe(at(state, "more", 2));
  });

  it("selects the active section's text on select all", () => {
    const state = editing("one\n\ntwo\nmore", "more");
    const next = state.apply(
      state.tr.setSelection(new AllSelection(state.doc)),
    );
    expect(next.selection.from).toBe(at(state, "two"));
    expect(next.selection.to).toBe(at(state, "more", 4));
  });
});

describe("finishing a section", () => {
  it("drops empty lines when the caret leaves the section", () => {
    const state = editing("one\n~\nmore\n\ntwo", "one");
    expect(notation(state)).toBe("one\n~\nmore\n\ntwo");
    expect(notation(withCaret(state, at(state, "two")))).toBe(
      "one\nmore\n\ntwo",
    );
  });

  it("keeps empty lines while the section is active", () => {
    const state = editing("one\n~\nmore\n\ntwo", "one");
    expect(notation(type(state, "x"))).toBe("xone\n~\nmore\n\ntwo");
  });

  it("removes an emptied section when editing ends", () => {
    const state = editing("one\n\ntwo", "two");
    const emptied = edit(state, (tr) =>
      tr.delete(at(state, "two"), at(state, "two", 3)),
    );
    expect(notation(exec(emptied, endEditing))).toBe("one");
  });

  it("keeps the last section with one empty line", () => {
    const state = editing("one\ntwo", "one");
    const emptied = edit(state, (tr) =>
      tr.delete(at(state, "one"), at(state, "two", 3)),
    );
    expect(notation(emptied)).toBe("~");
    expect(notation(exec(emptied, endEditing))).toBe("~");
  });

  it("drops empty lines when editing ends", () => {
    const state = editing("one\n~\n\ntwo", "one");
    expect(notation(exec(state, endEditing))).toBe("one\n\ntwo");
  });

  it("trims spaces at both ends of each line when the caret leaves", () => {
    const state = editing("  [G]one  \n more \n\ntwo", "one");
    expect(notation(withCaret(state, at(state, "two")))).toBe(
      "[G]one\nmore\n\ntwo",
    );
  });

  it("keeps spaces while the section is active", () => {
    const state = editing("one\n\ntwo", "one");
    expect(notation(type(state, " "))).toBe(" one\n\ntwo");
  });

  it("keeps a space with a chord", () => {
    const state = editing("  [G] one[D]\n\ntwo", "one");
    expect(notation(exec(state, endEditing))).toBe("[G] one[D] \n\ntwo");
  });

  it("collapses double spaces when the caret leaves", () => {
    const state = editing("one two\n\nthree", "two");
    const typed = type(state, " ");
    expect(notation(typed)).toBe("one  two\n\nthree");
    expect(notation(withCaret(typed, at(typed, "three")))).toBe(
      "one two\n\nthree",
    );
  });

  it("keeps only the spaces with chords in a run", () => {
    const state = editing("one  [G] two\n\nthree", "one");
    expect(notation(exec(state, endEditing))).toBe("one[G] two\n\nthree");
  });

  it("leaves no trailing space after a chord moves off the end", () => {
    const state = editing("one[D]\n\ntwo", "one");
    const moved = exec(state, moveChord(idOf(state, "D"), at(state, "one")));
    expect(notation(moved)).toBe("[D]one \n\ntwo");
    expect(notation(withCaret(moved, at(moved, "two")))).toBe("[D]one\n\ntwo");
  });
});

describe("undo across sections", () => {
  it("undoes edits in two sections and makes the first active", () => {
    const state = editing("one\n\ntwo", "one");
    const first = type(state, "x");
    const second = type(withCaret(first, at(first, "two")), "y");
    expect(notation(second)).toBe("xone\n\nytwo");
    const undone = exec(exec(second, undo), undo);
    expect(notation(undone)).toBe("one\n\ntwo");
    expect(active(undone)).toBe("one");
  });

  it("brings back a removed section and its text in one step", () => {
    const state = editing("one\n\ntwo", "two");
    const emptied = edit(state, (tr) =>
      tr.delete(at(state, "two"), at(state, "two", 3)),
    );
    const left = withCaret(emptied, at(emptied, "one"));
    expect(notation(left)).toBe("one");
    const undone = exec(left, undo);
    expect(notation(undone)).toBe("one\n\ntwo");
    expect(active(undone)).toBe("two");
    const redone = exec(undone, redo);
    expect(notation(redone)).toBe("one");
    expect(notation(exec(redone, undo))).toBe("one\n\ntwo");
  });
});
