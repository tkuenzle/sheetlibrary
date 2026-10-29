import type { ChordSymbol } from "chordsheet";
import type { Node } from "prosemirror-model";
import {
  type Command,
  type EditorState,
  Plugin,
  PluginKey,
  TextSelection,
  type Transaction,
} from "prosemirror-state";

import {
  type Chord,
  chordMark,
  chordsOn,
  newChordId,
  schema,
  symbolOf,
} from "./schema";

const deletedMeta = "chordsDeleted";

// Marks chords as deleted on purpose, so they are not rescued.
export function allowChordDeletion(tr: Transaction, ids: string[]) {
  tr.setMeta(deletedMeta, [...deletedOnPurpose(tr), ...ids]);
}

export function deletedOnPurpose(tr: Transaction): string[] {
  return (tr.getMeta(deletedMeta) as string[] | undefined) ?? [];
}

// The chords on the letter right after `pos`.
export function chordsAt(doc: Node, pos: number): Chord[] {
  const $pos = doc.resolve(pos);
  return pos < $pos.end() ? chordsOn(doc.nodeAt(pos)) : [];
}

// Sets the chords on the letter right after `pos`. At the end of a line,
// a trailing space is added for them to sit on.
export function setChords(tr: Transaction, pos: number, chords: Chord[]) {
  const $pos = tr.doc.resolve(pos);
  if (pos === $pos.end()) {
    if (chords.length === 0) return;
    tr.insertText(" ", pos);
  }
  tr.removeMark(pos, pos + 1, schema.marks.chord);
  if (chords.length > 0) tr.addMark(pos, pos + 1, chordMark(chords));
}

export function findChord(doc: Node, id: string) {
  let found: { pos: number; chord: Chord; chords: Chord[] } | null = null;
  doc.descendants((node, pos) => {
    if (found) return false;
    const chords = chordsOn(node);
    const chord = chords.find((c) => c.id === id);
    if (chord) found = { pos, chord, chords };
    return true;
  });
  return found as { pos: number; chord: Chord; chords: Chord[] } | null;
}

// Adds a chord to the letter right after `pos`, after any chords on it.
// The caret stays where it was.
export function insertChord(pos: number, chord: ChordSymbol): Command {
  return (state, dispatch) => {
    const tr = state.tr;
    const chords = chordsAt(state.doc, pos);
    setChords(tr, pos, [...chords, { id: newChordId(), ...chord }]);
    keepSelection(tr, state);
    dispatch?.(tr);
    return true;
  };
}

// Replaces a chord's parts, so a suffix or bass it no longer has goes.
export function changeChord(id: string, chord: ChordSymbol): Command {
  return (state, dispatch) => {
    const found = findChord(state.doc, id);
    if (!found) return false;
    const chords = found.chords.map((c) =>
      c.id === id ? { id, ...chord } : c,
    );
    const tr = state.tr;
    setChords(tr, found.pos, chords);
    dispatch?.(tr);
    return true;
  };
}

export function removeChord(id: string): Command {
  return (state, dispatch) => {
    const found = findChord(state.doc, id);
    if (!found) return false;
    const tr = state.tr;
    setChords(
      tr,
      found.pos,
      found.chords.filter((c) => c.id !== id),
    );
    allowChordDeletion(tr, [id]);
    dispatch?.(tr.setMeta(selectedKey, { id: null }));
    return true;
  };
}

// Every chord in the document, in order.
export function chordsIn(doc: Node): Chord[] {
  const chords: Chord[] = [];
  doc.descendants((node) => {
    chords.push(...chordsOn(node));
    return true;
  });
  return chords;
}

// Replaces every chord in the document with what `change` makes of it, in
// one step to undo. Ids stay, and so does the caret. A chord `change` leaves
// out of the result keeps its parts.
function replaceChords(
  state: EditorState,
  change: (chord: Chord) => ChordSymbol | undefined,
): Transaction | null {
  const tr = state.tr;
  state.doc.descendants((node, pos) => {
    const chords = chordsOn(node);
    if (chords.length === 0) return true;
    const next = chords.map((chord) => {
      const symbol = change(chord);
      return symbol ? { id: chord.id, ...symbolOf(symbol) } : chord;
    });
    if (next.some((chord, i) => !sameChord(chord, chords[i]))) {
      setChords(tr, pos, next);
    }
    return true;
  });
  if (!tr.docChanged) return null;
  keepSelection(tr, state);
  return tr;
}

function sameChord(a: Chord, b: Chord | undefined): boolean {
  return !!b && a.root === b.root && a.suffix === b.suffix && a.bass === b.bass;
}

// Moves every chord with `move`, such as to another key.
export function transposeChords(
  move: (chord: ChordSymbol) => ChordSymbol,
): Command {
  return (state, dispatch) => {
    const tr = replaceChords(state, (chord) => move(symbolOf(chord)));
    if (tr) dispatch?.(tr);
    return true;
  };
}

// Gives the chords with these ids their parts back. Ids that are gone are
// skipped.
export function setChordsById(chords: Chord[]): Command {
  const byId = new Map(chords.map((chord) => [chord.id, chord]));
  return (state, dispatch) => {
    const tr = replaceChords(state, (chord) => byId.get(chord.id));
    if (tr) dispatch?.(tr);
    return true;
  };
}

// Moves a chord to the letter right after `pos`, at `index` among the chords
// on it, or after them. On its own letter, `index` counts the other chords.
// The caret stays where it was. Moving a chord to where it is changes nothing.
export function moveChord(id: string, pos: number, index?: number): Command {
  return (state, dispatch) => {
    const found = findChord(state.doc, id);
    if (!found) return false;
    const others = found.chords.filter((c) => c.id !== id);
    const from = found.chords.indexOf(found.chord);
    if (
      pos === found.pos &&
      Math.min(index ?? others.length, others.length) === from
    ) {
      return true;
    }
    const tr = state.tr;
    setChords(tr, found.pos, others);
    const target = tr.mapping.map(pos);
    const chords = chordsAt(tr.doc, target);
    const at = Math.min(index ?? chords.length, chords.length);
    setChords(tr, target, chords.toSpliced(at, 0, found.chord));
    keepSelection(tr, state);
    dispatch?.(tr);
    return true;
  };
}

// Keeps the selection before a trailing space that `setChords` added, which
// would otherwise push a caret at the end of the line past it.
function keepSelection(tr: Transaction, state: EditorState) {
  const { anchor, head } = state.selection;
  tr.setSelection(
    TextSelection.create(
      tr.doc,
      tr.mapping.map(anchor, -1),
      tr.mapping.map(head, -1),
    ),
  );
}

const selectedKey = new PluginKey<string | null>("selected-chord");

interface SelectedMeta {
  id: string | null;
}

// The chord being edited, highlighted in the chord layer.
export function selectedChord() {
  return new Plugin<string | null>({
    key: selectedKey,
    state: {
      init: () => null,
      apply: (tr, value) => {
        const meta = tr.getMeta(selectedKey) as SelectedMeta | undefined;
        return meta ? meta.id : value;
      },
    },
  });
}

export function getSelectedChord(state: EditorState) {
  return selectedKey.getState(state) ?? null;
}

export function selectChord(id: string | null): Command {
  return (state, dispatch) => {
    dispatch?.(state.tr.setMeta(selectedKey, { id }));
    return true;
  };
}
