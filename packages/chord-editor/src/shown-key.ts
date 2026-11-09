import { type Key, type MarkedChord, transposeChord } from "chordsheet";
import {
  type Command,
  type EditorState,
  Plugin,
  PluginKey,
  type Transaction,
} from "prosemirror-state";

// The key the sheet is shown in, when it isn't the key its chords are
// stored in. The chord layer writes each chord moved from `from` to `to`.
// Showing a key changes nothing in the sheet, so it is no edit to save or
// undo.
export interface ShownKey {
  from: Key;
  to: Key;
}

const shownKeyKey = new PluginKey<ShownKey | null>("shown-key");

interface ShownMeta {
  shown: ShownKey | null;
}

export function shownKey() {
  return new Plugin<ShownKey | null>({
    key: shownKeyKey,
    state: {
      init: () => null,
      apply: (tr, value) => {
        const meta = tr.getMeta(shownKeyKey) as ShownMeta | undefined;
        return meta ? meta.shown : value;
      },
    },
  });
}

export function getShownKey(state: EditorState): ShownKey | null {
  return shownKeyKey.getState(state) ?? null;
}

// Shows the sheet in another key, or, with null, in its own. It isn't a
// step to undo.
export function showKey(shown: ShownKey | null): Command {
  return (state, dispatch) => {
    dispatch?.(setShownKey(state.tr, shown).setMeta("addToHistory", false));
    return true;
  };
}

// Sets the shown key as part of `tr`.
export function setShownKey(tr: Transaction, shown: ShownKey | null) {
  return tr.setMeta(shownKeyKey, { shown });
}

// The chord as it is shown.
export function shownChord<T extends MarkedChord>(
  state: EditorState,
  chord: T,
): T {
  const shown = getShownKey(state);
  return shown ? transposeChord(chord, shown.from, shown.to) : chord;
}
