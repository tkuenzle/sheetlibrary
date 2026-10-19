import type { Node } from "prosemirror-model";
import {
  type Command,
  type EditorState,
  Plugin,
  PluginKey,
  type Transaction,
} from "prosemirror-state";

import { type Chord, chordMark, chordsOn, newChordId, schema } from "./schema";

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
export function insertChord(pos: number, name: string): Command {
  return (state, dispatch) => {
    const tr = state.tr;
    const chords = chordsAt(state.doc, pos);
    setChords(tr, pos, [...chords, { id: newChordId(), name }]);
    dispatch?.(tr);
    return true;
  };
}

export function renameChord(id: string, name: string): Command {
  return (state, dispatch) => {
    const found = findChord(state.doc, id);
    if (!found) return false;
    const chords = found.chords.map((c) => (c.id === id ? { ...c, name } : c));
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

// Moves a chord to the letter right after `pos`, after any chords on it.
export function moveChord(id: string, pos: number): Command {
  return (state, dispatch) => {
    const found = findChord(state.doc, id);
    if (!found) return false;
    const tr = state.tr;
    setChords(
      tr,
      found.pos,
      found.chords.filter((c) => c.id !== id),
    );
    const target = tr.mapping.map(pos);
    setChords(tr, target, [...chordsAt(tr.doc, target), found.chord]);
    dispatch?.(tr);
    return true;
  };
}

const selectedKey = new PluginKey<string | null>("selected-chord");

interface SelectedMeta {
  id: string | null;
}

// The chord being edited in chord mode, highlighted in the chord layer.
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
