import {
  type ChordSheet,
  guessKey,
  type Key,
  stepKey,
  transposeChord,
} from "chordsheet";
import { type ReactNode, type RefObject, useReducer } from "react";

import { KeyButton } from "./key-button";
import type { SheetEditorHandle } from "./sheet-editor";

// The sheet's heading with its key button, shared by the pages that edit a
// sheet. See openspec/specs/editor-page.

function chordsOf(sheet: ChordSheet) {
  return sheet.sections.flatMap((s) => s.lines.flatMap((l) => l.chords));
}

type Chords = Parameters<typeof guessKey>[0];

export interface SheetKeyState {
  // The sheet's key: the set key, or else the key guessed from the chords
  // now.
  key: Key | null;
  // Where "Back" goes: the set key the sheet was loaded with, or the last
  // one set since. Without one, the first key guessed.
  original: Key | null;
  // Whether the original key was guessed rather than set.
  guessed: boolean;
  // The first key guessed from the chords.
  firstGuess: Key | null;
}

export type SheetKeyAction =
  | {
      type: "chords";
      chords: Chords;
      key: Key | null;
      original: Key | null;
    }
  | { type: "reset"; sheet: ChordSheet };

export function loadSheetKey(sheet: ChordSheet): SheetKeyState {
  const firstGuess = guessKey(chordsOf(sheet));
  const key = sheet.key ?? firstGuess;
  return { key, original: key, guessed: !sheet.key, firstGuess };
}

export function sheetKeyReducer(
  state: SheetKeyState,
  action: SheetKeyAction,
): SheetKeyState {
  switch (action.type) {
    case "chords": {
      const guess = guessKey(action.chords);
      const firstGuess = state.firstGuess ?? guess;
      return {
        key: action.key ?? guess,
        original: action.original ?? firstGuess,
        guessed: action.original === null,
        firstGuess,
      };
    }
    case "reset":
      return loadSheetKey(action.sheet);
  }
}

export interface SheetKey extends SheetKeyState {
  // Pass to the editor's onChordsChange.
  onChordsChange: (
    chords: Chords,
    key: Key | null,
    original: Key | null,
  ) => void;
  // Starts over with a newly loaded sheet.
  reset: (sheet: ChordSheet) => void;
}

// The sheet's key: the set key, or else guessed from its chords. Until the
// editor reports them, it comes from the loaded sheet, so the server
// renders the button too.
export function useSheetKey(sheet: ChordSheet): SheetKey {
  const [state, dispatch] = useReducer(sheetKeyReducer, sheet, loadSheetKey);
  return {
    ...state,
    onChordsChange: (chords, key, original) => {
      dispatch({ type: "chords", chords, key, original });
    },
    reset: (next) => {
      dispatch({ type: "reset", sheet: next });
    },
  };
}

// The heading, and the key button for a sheet with chords. `children` comes
// after them, on the same line. The title is text, or on the sheet page the
// button or field that renames it.
export function SheetTitle({
  title,
  sheetKey: { key, original, guessed },
  editor,
  readOnly = false,
  children,
}: {
  title: ReactNode;
  sheetKey: SheetKey;
  editor: RefObject<SheetEditorHandle | null>;
  // A read-only sheet can't be transposed, so it has no key button.
  readOnly?: boolean;
  children?: ReactNode;
}) {
  function moveTo(to: Key) {
    if (!key) return;
    editor.current?.transpose((c) => transposeChord(c, key, to), to);
  }

  return (
    <div className="editor-title">
      <h1>{title}</h1>
      {key && original && !readOnly && (
        <KeyButton
          current={key}
          original={original}
          guessed={guessed}
          onPick={moveTo}
          onSet={(to) => {
            editor.current?.setKey(to);
          }}
          onStep={(step) => {
            moveTo(stepKey(key, step));
          }}
          onBack={() => {
            moveTo(original);
          }}
          onUndo={() => {
            editor.current?.undo();
          }}
          onRedo={() => {
            editor.current?.redo();
          }}
        />
      )}
      {children}
    </div>
  );
}
