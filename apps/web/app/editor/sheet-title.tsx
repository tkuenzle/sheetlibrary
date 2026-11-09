import {
  type ChordSheet,
  guessKey,
  type Key,
  keyAbove,
  readKey,
  sameKey,
  semitonesBetween,
  stepKey,
  transposeChord,
} from "chordsheet";
import { type ReactNode, type RefObject, useEffect, useReducer } from "react";

import { KeyButton, keyName } from "./key-button";
import type { SheetEditorHandle } from "./sheet-editor";

// The sheet's heading with its key button, shared by the pages that edit a
// sheet. See openspec/specs/editor-page.

function chordsOf(sheet: ChordSheet) {
  return sheet.sections.flatMap((s) => s.lines.flatMap((l) => l.chords));
}

type Chords = Parameters<typeof guessKey>[0];

export interface SheetKeyState {
  // The song's key: the set key, or else the key guessed from the chords
  // now.
  key: Key | null;
  // Whether `key` is guessed, since no key is set.
  guessed: boolean;
  // The key guessed from the chords now, also when a key is set.
  guess: Key | null;
  // The key the sheet is shown in, when it isn't the song key. It changes
  // nothing in the sheet.
  shown: Key | null;
}

export type SheetKeyAction =
  | { type: "chords"; chords: Chords; key: Key | null }
  | { type: "show"; key: Key | null }
  | { type: "reset"; sheet: ChordSheet };

// The sheet's key as loaded, shown in the key written in `shown`, such as
// "F#m", if it is a key to move to for the song.
export function loadSheetKey(
  sheet: ChordSheet,
  shown: string | null = null,
): SheetKeyState {
  const guess = guessKey(chordsOf(sheet));
  const key = sheet.key ?? guess;
  const read = key && shown !== null ? readKey(shown, key.minor) : null;
  return {
    key,
    guessed: !sheet.key,
    guess,
    shown: key && read && !sameKey(read, key) ? read : null,
  };
}

// The key to show for the song key `key`: none when it is the song key.
function showIn(key: Key | null, shown: Key | null): Key | null {
  return key && shown && !sameKey(key, shown) ? shown : null;
}

export function sheetKeyReducer(
  state: SheetKeyState,
  action: SheetKeyAction,
): SheetKeyState {
  switch (action.type) {
    case "chords": {
      const guess = guessKey(action.chords);
      const key = action.key ?? guess;
      // A new song key keeps the distance to the shown key, so no chord
      // reads differently.
      const shown =
        key && state.key && state.shown && !sameKey(key, state.key)
          ? keyAbove(key, semitonesBetween(state.key, state.shown))
          : state.shown;
      return {
        key,
        guessed: action.key === null,
        guess,
        shown: showIn(key, shown),
      };
    }
    case "show":
      return { ...state, shown: showIn(state.key, action.key) };
    case "reset":
      return loadSheetKey(action.sheet);
  }
}

export interface SheetKey extends SheetKeyState {
  // Pass to the editor's onChordsChange.
  onChordsChange: (chords: Chords, key: Key | null) => void;
  // Shows the sheet in a key, or, with null, in the song key.
  show: (key: Key | null) => void;
  // Starts over with a newly loaded sheet, in its song key.
  reset: (sheet: ChordSheet) => void;
}

// The sheet's key: the set key, or else guessed from its chords. Until the
// editor reports them, it comes from the loaded sheet, so the server
// renders the button too. `shown` is the address's `key`, read once; the
// address then follows the shown key, without a new entry in the history.
export function useSheetKey(
  sheet: ChordSheet,
  shown: string | null = null,
): SheetKey {
  const [state, dispatch] = useReducer(sheetKeyReducer, null, () =>
    loadSheetKey(sheet, shown),
  );

  const written = state.shown ? keyName(state.shown) : null;
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("key") === written) return;
    if (written) url.searchParams.set("key", written);
    else url.searchParams.delete("key");
    window.history.replaceState(window.history.state, "", url);
  }, [written]);

  return {
    ...state,
    onChordsChange: (chords, key) => {
      dispatch({ type: "chords", chords, key });
    },
    show: (key) => {
      dispatch({ type: "show", key });
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
  sheetKey: { key, guessed, guess, shown, show },
  editor,
  readOnly = false,
  children,
}: {
  title: ReactNode;
  sheetKey: SheetKey;
  editor: RefObject<SheetEditorHandle | null>;
  // A read-only sheet can still be shown in another key, but not changed.
  readOnly?: boolean;
  children?: ReactNode;
}) {
  const current = shown ?? key;

  return (
    <div className="editor-title">
      <h1>{title}</h1>
      {key && current && (
        <KeyButton
          current={current}
          song={key}
          guessed={guessed}
          guess={guess}
          readOnly={readOnly}
          onPick={show}
          onSet={(to) => {
            editor.current?.setKey(to);
          }}
          onStep={(step) => {
            show(stepKey(current, step));
          }}
          onBack={() => {
            show(null);
          }}
          onMake={() => {
            if (!shown) return;
            show(null);
            editor.current?.transpose(
              (c) => transposeChord(c, key, shown),
              shown,
            );
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
