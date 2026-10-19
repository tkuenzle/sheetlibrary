import { baseKeymap } from "prosemirror-commands";
import { history, redo, undo } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { Fragment, type Node, Slice } from "prosemirror-model";
import { type Command, EditorState, Plugin } from "prosemirror-state";

import { chordLayer, type ChordLayerOptions } from "./chord-layer";
import { selectedChord } from "./chords";
import { docFromChordPro } from "./chordpro";
import { chordRescue } from "./rescue";
import { chordMark, chordsOn, newChordId } from "./schema";

export interface EditorOptions extends ChordLayerOptions {
  // Opens the chord input at the caret (keyboard shortcut in text mode).
  onChordShortcut?: Command;
  // Off in unit tests, which have no DOM.
  layer?: boolean;
}

export function createEditorState(song: string, options: EditorOptions = {}) {
  return EditorState.create({
    doc: docFromChordPro(song),
    plugins: [
      chordRescue(),
      selectedChord(),
      freshIdsOnPaste(),
      history(),
      keymap({
        "Mod-z": undo,
        "Shift-Mod-z": redo,
        "Mod-y": redo,
        ...(options.onChordShortcut && { "Mod-k": options.onChordShortcut }),
      }),
      keymap(baseKeymap),
      ...(options.layer === false ? [] : [chordLayer(options)]),
    ],
  });
}

// Pasted chords are new chords, even when they were copied from this song.
function freshIdsOnPaste() {
  return new Plugin({
    props: {
      transformPasted: (slice) =>
        new Slice(withFreshIds(slice.content), slice.openStart, slice.openEnd),
    },
  });
}

function withFreshIds(fragment: Fragment): Fragment {
  const nodes: Node[] = [];
  fragment.forEach((node) => {
    const chords = chordsOn(node);
    if (chords.length > 0) {
      const fresh = chords.map((chord) => ({ ...chord, id: newChordId() }));
      nodes.push(node.mark(chordMark(fresh).addToSet(node.marks)));
    } else if (node.isText) nodes.push(node);
    else nodes.push(node.copy(withFreshIds(node.content)));
  });
  return Fragment.from(nodes);
}
