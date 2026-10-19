import {
  AllSelection,
  type Command,
  type EditorState,
  Plugin,
  PluginKey,
  type Selection,
  TextSelection,
  type Transaction,
} from "prosemirror-state";
import { Mapping } from "prosemirror-transform";
import { Decoration, DecorationSet } from "prosemirror-view";

import { isEmptyLine, schema } from "./schema";

// The user edits one section at a time: the one with the caret. When the
// caret leaves it, or editing ends, the section is cleaned up. The active
// section is not part of the document, so it is not stored or undone.

// The position right before the active section, or null when the user is
// not editing.
const activeKey = new PluginKey<number | null>("active-section");

type ActiveMeta = "start" | "end";

export function activeSection() {
  return new Plugin<number | null>({
    key: activeKey,
    state: {
      init: () => null,
      apply: (tr, value, _oldState, newState) => {
        const meta = tr.getMeta(activeKey) as ActiveMeta | undefined;
        if (meta === "end" || (value === null && meta !== "start")) {
          return null;
        }
        return (
          sectionOf(newState.selection) ??
          (value === null ? 0 : tr.mapping.map(value, 1))
        );
      },
    },
    props: {
      attributes: (state): Record<string, string> =>
        getActiveSection(state) === null ? {} : { class: "is-editing" },
      decorations: (state) => {
        const pos = getActiveSection(state);
        const section = pos === null ? null : state.doc.nodeAt(pos);
        if (pos === null || !section) return null;
        return DecorationSet.create(state.doc, [
          Decoration.node(pos, pos + section.nodeSize, { class: "is-active" }),
        ]);
      },
      handleDOMEvents: {
        focus: (view) => {
          startEditing(view.state, view.dispatch);
          return false;
        },
      },
    },
    appendTransaction: (transactions, oldState, newState) => {
      const tr = newState.tr;
      keepInOneSection(tr, getActiveSection(newState));

      const old = getActiveSection(oldState);
      if (old !== null) {
        const mapping = new Mapping();
        for (const t of transactions) mapping.appendMapping(t.mapping);
        const result = mapping.mapResult(old, 1);
        if (!result.deleted && result.pos !== getActiveSection(newState)) {
          cleanUpSection(tr, result.pos);
        }
      }
      return tr.docChanged || tr.selectionSet ? tr : null;
    },
  });
}

export function getActiveSection(state: EditorState): number | null {
  return activeKey.getState(state) ?? null;
}

// Starts editing in the section with the caret. The editor calls it when it
// gets focus.
export const startEditing: Command = (state, dispatch) => {
  if (getActiveSection(state) !== null) return false;
  dispatch?.(state.tr.setMeta(activeKey, "start"));
  return true;
};

// Ends editing, which cleans up the active section. Losing focus doesn't end
// editing, since the chord input takes the focus.
export const endEditing: Command = (state, dispatch, view) => {
  if (getActiveSection(state) === null) return false;
  dispatch?.(state.tr.setMeta(activeKey, "end"));
  view?.dom.blur();
  return true;
};

function sectionOf(selection: Selection): number | null {
  const { $anchor } = selection;
  return $anchor.depth >= 1 ? $anchor.before(1) : null;
}

// A selection stays inside the section where it starts. Select all selects
// the text of the active section.
function keepInOneSection(tr: Transaction, active: number | null) {
  const { selection } = tr;
  if (selection instanceof AllSelection) {
    const pos = active ?? 0;
    const section = tr.doc.nodeAt(pos);
    if (section) {
      tr.setSelection(
        TextSelection.create(tr.doc, pos + 2, pos + section.nodeSize - 2),
      );
    }
    return;
  }
  if (!(selection instanceof TextSelection)) return;
  const { $anchor, $head } = selection;
  if ($anchor.depth < 1 || $head.depth < 1) return;
  const start = $anchor.before(1);
  if ($head.before(1) === start) return;
  const end = start + $anchor.node(1).nodeSize;
  const head = $head.pos > $anchor.pos ? end - 2 : start + 2;
  tr.setSelection(TextSelection.create(tr.doc, $anchor.pos, head));
}

// Drops the empty lines of the section at `pos`, as the chord sheet model
// does, and removes the section if nothing is left. The last section stays,
// with one empty line, since the editor needs one to type in.
function cleanUpSection(tr: Transaction, pos: number) {
  const section = tr.doc.nodeAt(pos);
  if (section?.type !== schema.nodes.section) return;
  const empty: number[] = [];
  section.forEach((line, offset) => {
    if (isEmptyLine(line)) empty.push(pos + 1 + offset);
  });
  if (empty.length === section.childCount) {
    if (tr.doc.childCount > 1) {
      tr.delete(pos, pos + section.nodeSize);
      return;
    }
    empty.shift();
  }
  for (const line of empty.reverse()) {
    tr.delete(line, line + (tr.doc.nodeAt(line)?.nodeSize ?? 0));
  }
}
