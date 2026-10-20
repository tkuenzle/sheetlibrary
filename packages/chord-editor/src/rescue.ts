import { isHistoryTransaction } from "prosemirror-history";
import type { Node } from "prosemirror-model";
import {
  Plugin,
  Selection,
  TextSelection,
  type Transaction,
} from "prosemirror-state";
import { Mapping } from "prosemirror-transform";

import { chordsAt, deletedOnPurpose, setChords } from "./chords";
import { type Chord, chordsOn, forEachLine, schema } from "./schema";

// "Chords stick to the lyrics": a chord whose letter is deleted or replaced
// is put on the nearest remaining letter. It is only allowed to go when the
// user deletes it on purpose, or when its whole line is deleted.

export function chordRescue() {
  return new Plugin({
    appendTransaction(transactions, oldState, newState) {
      if (!transactions.some((tr) => tr.docChanged)) return null;
      // Undo and redo bring back a state that was already rescued. Undoing
      // an added chord removes it, and must not rescue it.
      if (transactions.some(isHistoryTransaction)) return null;

      const mapping = new Mapping();
      const allowed = new Set<string>();
      for (const tr of transactions) {
        mapping.appendMapping(tr.mapping);
        deletedOnPurpose(tr).forEach((id) => allowed.add(id));
      }

      const present = new Set<string>();
      newState.doc.descendants((node) => {
        for (const chord of chordsOn(node)) present.add(chord.id);
      });

      // Lost chords by their new position, in old document order.
      const lost = new Map<number, Chord[]>();
      forEachLine(oldState.doc, (line, pos) => {
        const start = pos + 1;
        const end = start + line.content.size;
        let lineDeleted: boolean | undefined;
        line.forEach((child, childOffset) => {
          const missing = chordsOn(child).filter(
            (chord) => !present.has(chord.id) && !allowed.has(chord.id),
          );
          if (missing.length === 0) return;
          lineDeleted ??= isLineDeleted(mapping, start, end);
          if (lineDeleted) return;
          // Leaning left puts the chord on the start of any inserted text.
          const target = mapping.map(start + childOffset, -1);
          lost.set(target, [...(lost.get(target) ?? []), ...missing]);
        });
      });

      const tr = newState.tr;
      const head = tr.selection.empty ? tr.selection.head : null;
      for (const target of [...lost.keys()].sort((a, b) => b - a)) {
        const pos = inlinePos(tr.doc, target);
        const chords = lost.get(target) ?? [];
        setChords(tr, pos, [...chords, ...chordsAt(tr.doc, pos)]);
      }

      // Keep the caret before a trailing space added under it.
      if (head !== null) {
        const caret = tr.mapping.map(head, -1);
        if (tr.selection.head !== caret) {
          tr.setSelection(TextSelection.create(tr.doc, caret));
        }
      }

      keepChordsOnOneLetter(tr);
      return tr.docChanged ? tr : null;
    },
  });
}

// A line is deleted when all of its content is gone, together with its start
// or its end (the line break). Replacing all of its text keeps the line.
function isLineDeleted(mapping: Mapping, start: number, end: number) {
  for (let pos = start; pos < end; pos++) {
    if (!mapping.mapResult(pos, 1).deletedAfter) return false;
  }
  return (
    mapping.mapResult(start - 1, 1).deletedAfter ||
    mapping.mapResult(end, 1).deletedAfter
  );
}

// Typing inside a chord's letter can spread its mark. Keep it on the first
// letter only.
function keepChordsOnOneLetter(tr: Transaction) {
  tr.doc.descendants((node, pos) => {
    const mark = schema.marks.chord.isInSet(node.marks);
    if (mark && node.nodeSize > 1) {
      tr.removeMark(pos + 1, pos + node.nodeSize, mark);
    }
  });
}

function inlinePos(doc: Node, pos: number) {
  const $pos = doc.resolve(pos);
  return $pos.parent.inlineContent ? pos : Selection.near($pos, -1).from;
}
