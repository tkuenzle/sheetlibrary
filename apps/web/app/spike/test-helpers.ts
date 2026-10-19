import { closeHistory } from "prosemirror-history";
import {
  type Command,
  type EditorState,
  TextSelection,
  type Transaction,
} from "prosemirror-state";

import { docToChordPro } from "./chordpro";
import { createEditorState } from "./editor";

export function song(text: string) {
  return createEditorState(text, { layer: false });
}

export function chordPro(state: EditorState) {
  return docToChordPro(state.doc);
}

// Position right before the letter at `offset` in the first match of
// `needle`.
export function at(state: EditorState, needle: string, offset = 0) {
  const matches: number[] = [];
  state.doc.forEach((line, lineOffset) => {
    let text = "";
    const positions: number[] = [];
    line.forEach((child, childOffset) => {
      const start = lineOffset + 1 + childOffset;
      for (let i = 0; i < child.nodeSize; i++) positions.push(start + i);
      text += child.text ?? "";
    });
    positions.push(lineOffset + 1 + line.content.size);
    const index = text.indexOf(needle);
    const pos = positions[index + offset];
    if (index >= 0 && pos !== undefined) matches.push(pos);
  });
  const [first] = matches;
  if (first === undefined) throw new Error(`"${needle}" not found`);
  return first;
}

// Applies one edit as its own undo step.
export function edit(state: EditorState, change: (tr: Transaction) => void) {
  const tr = state.tr;
  change(tr);
  return state.apply(closeHistory(tr));
}

export function withCaret(state: EditorState, pos: number) {
  return state.apply(
    state.tr.setSelection(TextSelection.create(state.doc, pos)),
  );
}

export function exec(state: EditorState, command: Command) {
  let next = state;
  const handled = command(state, (tr) => {
    next = state.apply(closeHistory(tr));
  });
  if (!handled) throw new Error("command not handled");
  return next;
}

export function type(state: EditorState, text: string) {
  return edit(state, (tr) => tr.insertText(text));
}
