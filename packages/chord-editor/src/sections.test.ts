import { splitBlock } from "prosemirror-commands";
import { undo } from "prosemirror-history";
import { describe, expect, it } from "vitest";

import { getActiveSection, startEditing } from "./active-section";
import { TextSelection } from "prosemirror-state";

import {
  joinWithPrevious,
  moveSection,
  sliceFromText,
  splitOnEmptyLine,
} from "./sections";
import { at, edit, exec, notation, song, withCaret } from "./test-helpers";

// A sheet with the caret before `needle`, or at `offset` letters into it,
// being edited.
function editing(text: string, needle: string, offset = 0) {
  const state = song(text);
  return exec(withCaret(state, at(state, needle, offset)), startEditing);
}

// Enter, as the editor's keymap runs it.
function enter(state: ReturnType<typeof song>) {
  return splitOnEmptyLine(state)
    ? exec(state, splitOnEmptyLine)
    : exec(state, splitBlock);
}

// The text of the line with the caret, and where the caret is in it.
function caret(state: ReturnType<typeof song>) {
  const { $head } = state.selection;
  return [$head.parent.textContent, $head.parentOffset];
}

describe("enter on an empty line", () => {
  it("splits the section there", () => {
    const state = editing("[G]one\ntwo\nthree\nfour", "two", 3);
    const next = enter(enter(state));
    expect(notation(next)).toBe("[G]one\ntwo\n\nthree\nfour");
    expect(caret(next)).toEqual(["three", 0]);
    expect(getActiveSection(next)).toBe(next.selection.$head.before(1));
  });

  it("moves an empty last line to a new section", () => {
    const state = editing("one\ntwo\n\nlast", "two", 3);
    const next = enter(enter(state));
    expect(notation(next)).toBe("one\ntwo\n\n~\n\nlast");
    expect(caret(next)).toEqual(["", 0]);
  });

  it("is undone in one step", () => {
    const state = editing("one\ntwo\nthree", "two", 3);
    const split = enter(enter(state));
    expect(notation(exec(split, undo))).toBe("one\ntwo\n~\nthree");
  });
});

describe("backspace at the start of a section", () => {
  it("joins it with the section before", () => {
    const state = editing("one\ntwo\n\n[D]three\nfour", "three");
    const next = exec(state, joinWithPrevious);
    expect(notation(next)).toBe("one\ntwo\n[D]three\nfour");
    expect(caret(next)).toEqual(["three", 0]);
  });

  it("does nothing special in the first section or inside a section", () => {
    expect(joinWithPrevious(editing("one\n\ntwo", "one"))).toBe(false);
    expect(joinWithPrevious(editing("one\n\ntwo\nmore", "more"))).toBe(false);
    expect(joinWithPrevious(editing("one\n\ntwo", "two", 1))).toBe(false);
  });

  it("is undone by splitting the sections again", () => {
    const state = editing("one\n\ntwo", "two");
    const joined = exec(state, joinWithPrevious);
    expect(notation(exec(joined, undo))).toBe("one\n\ntwo");
  });
});

describe("pasting text with blank lines", () => {
  function paste(state: ReturnType<typeof song>, text: string) {
    return edit(state, (tr) => tr.replaceSelection(sliceFromText(text)));
  }

  it("makes one section per block of lines", () => {
    const state = editing("~", "");
    expect(notation(paste(state, "a\nb\n\nc"))).toBe("a\nb\n\nc");
  });

  it("splits the section it is pasted into", () => {
    const state = editing("one two\nmore", "two");
    expect(notation(paste(state, "a\n\nb\n \n\nc"))).toBe(
      "one a\n\nb\n\nctwo\nmore",
    );
  });

  it("pastes a single line into the line", () => {
    const state = editing("one two", "two");
    expect(notation(paste(state, "a "))).toBe("one a two");
  });
});

describe("moving a section", () => {
  const sheet = "[G]one\n\nWas [D]blind\nbut   now ~\n~\n\nthree";

  it("moves it up and keeps the caret and the active section", () => {
    const next = exec(editing(sheet, "blind", 2), moveSection(-1));
    expect(notation(next)).toBe(
      "Was [D]blind\nbut   now ~\n~\n\n[G]one\n\nthree",
    );
    expect(caret(next)).toEqual(["Was blind", 6]);
    expect(getActiveSection(next)).toBe(0);
  });

  it("moves it down", () => {
    const next = exec(editing(sheet, "now"), moveSection(1));
    expect(notation(next)).toBe(
      "[G]one\n\nthree\n\nWas [D]blind\nbut   now ~\n~",
    );
    expect(caret(next)).toEqual(["but   now ~", 6]);
    expect(getActiveSection(next)).toBe(next.selection.$head.before(1));
  });

  it("keeps a selection", () => {
    const state = editing(sheet, "Was");
    const selected = state.apply(
      state.tr.setSelection(
        TextSelection.create(state.doc, at(state, "Was"), at(state, "blind")),
      ),
    );
    const next = exec(selected, moveSection(-1));
    expect(next.doc.textBetween(next.selection.from, next.selection.to)).toBe(
      "Was ",
    );
  });

  it("does nothing at the ends or when not editing", () => {
    expect(moveSection(-1)(editing(sheet, "one"))).toBe(false);
    expect(moveSection(1)(editing(sheet, "three"))).toBe(false);
    expect(moveSection(1)(song(sheet))).toBe(false);
  });

  it("is undone one move at a time, with the moved section active", () => {
    const once = exec(editing(sheet, "three"), moveSection(-1));
    const twice = exec(once, moveSection(-1));
    const undone = exec(twice, undo);
    expect(notation(undone)).toBe(notation(once));
    expect(caret(undone)).toEqual(["three", 0]);
    expect(getActiveSection(undone)).toBe(undone.selection.$head.before(1));
  });
});
