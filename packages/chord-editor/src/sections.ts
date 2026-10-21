import { Fragment, type Node, Slice } from "prosemirror-model";
import { closeHistory } from "prosemirror-history";
import { type Command, Plugin, TextSelection } from "prosemirror-state";

import { getActiveSection } from "./active-section";
import { isEmptyLine, schema } from "./schema";

// A blank line is a section break, whether it is typed or pasted.

// Enter on an empty line splits the section there. The empty line goes, and
// the lines after it start a new section with the caret. An empty last line
// moves to the new section instead.
export const splitOnEmptyLine: Command = (state, dispatch) => {
  const { selection } = state;
  const { $head } = selection;
  if (!selection.empty || $head.depth !== 2) return false;
  if (!isEmptyLine($head.parent) || $head.index(1) === 0) return false;
  if (dispatch) {
    const tr = state.tr;
    const start = $head.before(2);
    const last = $head.index(1) === $head.node(1).childCount - 1;
    if (!last) tr.delete(start, $head.after(2));
    tr.split(start, 1);
    // Past the end of the old section, the start of the new one and its
    // first line.
    tr.setSelection(TextSelection.create(tr.doc, start + 3));
    dispatch(tr.scrollIntoView());
  }
  return true;
};

// Backspace at the start of a section joins it with the section before. Its
// lines are added after that section's lines; no lines are merged.
export const joinWithPrevious: Command = (state, dispatch) => {
  const { selection } = state;
  const { $head } = selection;
  if (!selection.empty || $head.depth !== 2) return false;
  if ($head.parentOffset !== 0 || $head.index(1) !== 0) return false;
  if ($head.index(0) === 0) return false;
  dispatch?.(state.tr.join($head.before(1)).scrollIntoView());
  return true;
};

// Turns pasted plain text into sections, split on lines that are empty or
// only spaces. The slice is open, so its first and last lines join the line
// the text is pasted into.
export function sliceFromText(text: string): Slice {
  const sections: Node[] = [];
  let lines: Node[] = [];
  for (const line of text.split(/\r\n?|\n/)) {
    if (line.trim() === "") {
      if (lines.length > 0)
        sections.push(schema.nodes.section.create(null, lines));
      lines = [];
      continue;
    }
    lines.push(schema.nodes.line.create(null, schema.text(line)));
  }
  if (lines.length > 0) sections.push(schema.nodes.section.create(null, lines));
  return sections.length > 0
    ? new Slice(Fragment.from(sections), 2, 2)
    : Slice.empty;
}

export function sectionBreaks() {
  return new Plugin({
    props: {
      clipboardTextParser: (text) => sliceFromText(text),
    },
  });
}

// Moves the active section up (-1) or down (1), past its neighbour. Both
// sections are replaced in one step, so the active-section plugin sees the
// old section as gone and cleans nothing up. The caret keeps its spot in the
// moved section, which stays active.
export function moveSection(direction: -1 | 1): Command {
  return (state, dispatch) => {
    const active = getActiveSection(state);
    if (active === null) return false;
    const { doc, selection } = state;
    const index = doc.resolve(active).index(0);
    const section = doc.child(index);
    const other = index + direction;
    if (other < 0 || other >= doc.childCount) return false;
    if (dispatch) {
      const neighbour = doc.child(other);
      const from = direction < 0 ? active - neighbour.nodeSize : active;
      const to = from + section.nodeSize + neighbour.nodeSize;
      const start = direction < 0 ? from : from + neighbour.nodeSize;
      const tr = state.tr.replaceWith(
        from,
        to,
        direction < 0 ? [section, neighbour] : [neighbour, section],
      );
      tr.setSelection(
        TextSelection.create(
          tr.doc,
          start + selection.anchor - active,
          start + selection.head - active,
        ),
      );
      // Each move is its own undo step, even when pressed in quick succession.
      dispatch(closeHistory(tr));
    }
    return true;
  };
}
