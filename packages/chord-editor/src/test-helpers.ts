import type { Node } from "prosemirror-model";
import { closeHistory } from "prosemirror-history";
import {
  type Command,
  type EditorState,
  TextSelection,
  type Transaction,
} from "prosemirror-state";

import { createEditorState } from "./editor";
import { chordMark, chordsOn, forEachLine, newChordId, schema } from "./schema";

// Tests write a sheet as lines of text with chords in brackets before their
// letter, for example "[G]Amazing grace". A blank line starts a new section,
// and "~" stands for an empty line inside a section. Chords after the last
// letter sit on a trailing space, as in the editor.

export function song(text: string) {
  return createEditorState(docFromNotation(text), { layer: false });
}

export function notation(state: EditorState) {
  const sections: string[] = [];
  state.doc.forEach((section) => {
    const lines: string[] = [];
    section.forEach((line) => {
      let text = "";
      line.forEach((child) => {
        text += chordsOn(child)
          .map((chord) => `[${chord.chord}]`)
          .join("");
        text += child.text ?? "";
      });
      lines.push(text || "~");
    });
    sections.push(lines.join("\n"));
  });
  return sections.join("\n\n");
}

function docFromNotation(text: string): Node {
  return schema.nodes.doc.create(
    null,
    text
      .split("\n\n")
      .map((section) =>
        schema.nodes.section.create(
          null,
          section.split("\n").map(lineFromNotation),
        ),
      ),
  );
}

function lineFromNotation(line: string): Node {
  if (line === "~") return schema.nodes.line.create();
  const content: Node[] = [];
  let chords: { id: string; chord: string }[] = [];
  const parts = line.split(/\[([^\]]*)\]/);
  for (const [index, part] of parts.entries()) {
    if (index % 2 === 1) {
      chords.push({ id: newChordId(), chord: part });
      continue;
    }
    const last = index === parts.length - 1;
    const text = chords.length > 0 && !part && last ? " " : part;
    if (!text) continue;
    if (chords.length === 0) {
      content.push(schema.text(text));
      continue;
    }
    content.push(schema.text(text.slice(0, 1), [chordMark(chords)]));
    chords = [];
    if (text.length > 1) content.push(schema.text(text.slice(1)));
  }
  return schema.nodes.line.create(null, content);
}

// Position right before the letter at `offset` in the first match of
// `needle`.
export function at(state: EditorState, needle: string, offset = 0) {
  const matches: number[] = [];
  forEachLine(state.doc, (line, linePos) => {
    let text = "";
    const positions: number[] = [];
    line.forEach((child, childOffset) => {
      const start = linePos + 1 + childOffset;
      for (let i = 0; i < child.nodeSize; i++) positions.push(start + i);
      text += child.text ?? "";
    });
    positions.push(linePos + 1 + line.content.size);
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

// Runs a command. One that changes the document is its own undo step.
export function exec(state: EditorState, command: Command) {
  let next = state;
  const handled = command(state, (tr) => {
    next = state.apply(tr.docChanged ? closeHistory(tr) : tr);
  });
  if (!handled) throw new Error("command not handled");
  return next;
}

export function type(state: EditorState, text: string) {
  return edit(state, (tr) => tr.insertText(text));
}

export function idOf(state: EditorState, chord: string) {
  let id: string | undefined;
  state.doc.descendants((node) => {
    id ??= chordsOn(node).find((c) => c.chord === chord)?.id;
  });
  if (!id) throw new Error(`chord ${chord} not found`);
  return id;
}
