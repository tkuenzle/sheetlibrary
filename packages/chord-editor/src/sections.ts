import { Fragment, type Node, Slice } from "prosemirror-model";
import { type Command, Plugin, TextSelection } from "prosemirror-state";

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
