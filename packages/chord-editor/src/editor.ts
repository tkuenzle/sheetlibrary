import { baseKeymap } from "prosemirror-commands";
import { history, redo, undo } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { Fragment, type Node, Slice } from "prosemirror-model";
import { EditorState, Plugin } from "prosemirror-state";

import { activeSection, endEditing } from "./active-section";
import { chordLayer, type ChordLayerOptions } from "./chord-layer";
import { selectedChord } from "./chords";
import { type Anchor, anchorAt } from "./letter";
import { chordRescue } from "./rescue";
import { chordMark, chordsOn, newChordId } from "./schema";
import { sectionToolbar, type SectionToolbarOptions } from "./section-toolbar";
import { joinWithPrevious, sectionBreaks, splitOnEmptyLine } from "./sections";

export interface EditorOptions
  extends ChordLayerOptions, SectionToolbarOptions {
  // Ctrl+K or Cmd+K, with the position of the caret and its letter. The app
  // opens the chord input there.
  onChordShortcut?: (pos: number, anchor: Anchor) => void;
  // Off in unit tests, which have no DOM.
  layer?: boolean;
}

export function createEditorState(doc: Node, options: EditorOptions = {}) {
  const { onChordShortcut } = options;
  return EditorState.create({
    doc,
    plugins: [
      chordRescue(),
      activeSection(),
      selectedChord(),
      freshIdsOnPaste(),
      sectionBreaks(),
      history(),
      keymap({
        "Mod-z": undo,
        "Shift-Mod-z": redo,
        "Mod-y": redo,
        Enter: splitOnEmptyLine,
        Backspace: joinWithPrevious,
        Escape: endEditing,
        ...(onChordShortcut && {
          "Mod-k": (state, _dispatch, view) => {
            const { head } = state.selection;
            if (view) onChordShortcut(head, anchorAt(view, head));
            return true;
          },
        }),
      }),
      keymap(baseKeymap),
      ...(options.layer === false
        ? []
        : [chordLayer(options), sectionToolbar(options)]),
    ],
  });
}

// Pasted chords are new chords, even when they were copied from this section.
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
