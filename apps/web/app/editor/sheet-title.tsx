import {
  type ChordSheet,
  guessKey,
  type Key,
  keyAbove,
  MAX_CAPO,
  readCapo,
  readKey,
  sameKey,
  semitonesBetween,
  shapesKey,
  stepKey,
  transposeChord,
} from "chordsheet";
import { type ReactNode, type RefObject, useEffect, useReducer } from "react";

import { CapoButton } from "./capo-button";
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
  // The capo's fret, 0 for none. The chords show the shapes to play with
  // it, and nothing in the sheet changes.
  capo: number;
}

export type SheetKeyAction =
  | { type: "chords"; chords: Chords; key: Key | null }
  // `keepCapo` is for a move that doesn't change how the sheet sounds.
  | { type: "show"; key: Key | null; keepCapo?: boolean }
  | { type: "capo"; capo: number }
  | { type: "reset"; sheet: ChordSheet; capo: number };

// The sheet's key as loaded, shown in the key written in `shown`, such as
// "F#m", if it is a key to move to for the song, with the capo written in
// `capo`, such as "3", if it is a fret from 1 to MAX_CAPO.
export function loadSheetKey(
  sheet: ChordSheet,
  shown: string | null = null,
  capo: string | null = null,
): SheetKeyState {
  const guess = guessKey(chordsOf(sheet));
  const key = sheet.key ?? guess;
  const read = key && shown !== null ? readKey(shown, key.minor) : null;
  return {
    key,
    guessed: !sheet.key,
    guess,
    shown: key && read && !sameKey(read, key) ? read : null,
    capo: key && capo !== null ? (readCapo(capo) ?? 0) : 0,
  };
}

// The capo after a transpose to `shown`, or, with null, to the song key.
// It keeps the shapes where that takes a fret from 1 to MAX_CAPO, and is
// gone where the shapes are the new key. Otherwise it stays, and the shapes
// change.
function capoAfter(state: SheetKeyState, shown: Key | null): number {
  if (!state.key || state.capo === 0) return state.capo;
  const shapes = shapesKey(state.shown ?? state.key, state.capo);
  const fret = semitonesBetween(shapes, shown ?? state.key);
  return fret <= MAX_CAPO ? fret : state.capo;
}

// The key the chords are drawn in, when it isn't the song key: the shown
// key, or with a capo, the shapes to play there.
export function drawnKey({ key, shown, capo }: SheetKeyState): Key | null {
  if (!key) return null;
  const drawn = capo ? shapesKey(shown ?? key, capo) : shown;
  return drawn && !sameKey(drawn, key) ? drawn : null;
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
        // The shown key keeps its distance, so the shapes stay too.
        capo: key ? state.capo : 0,
      };
    }
    case "show": {
      const shown = showIn(state.key, action.key);
      const capo = action.keepCapo ? state.capo : capoAfter(state, shown);
      return { ...state, shown, capo };
    }
    case "capo":
      return { ...state, capo: state.key ? action.capo : 0 };
    case "reset": {
      const loaded = loadSheetKey(action.sheet);
      return { ...loaded, capo: loaded.key ? action.capo : 0 };
    }
  }
}

export interface SheetKey extends SheetKeyState {
  // Pass to the editor's onChordsChange.
  onChordsChange: (chords: Chords, key: Key | null) => void;
  // Shows the sheet in a key, or, with null, in the song key. The capo
  // moves to keep the shapes, unless `keepCapo`.
  show: (key: Key | null, options?: { keepCapo?: boolean }) => void;
  // Puts the capo on a fret, or, with 0, takes it off.
  setCapo: (capo: number) => void;
  // Starts over with a newly loaded sheet, in its song key, with a capo.
  reset: (sheet: ChordSheet, capo?: number) => void;
  // The key the chords are drawn in, when it isn't the song key. Pass to
  // the editor's shownKey.
  drawn: Key | null;
}

// The address's query for a key state, such as "key=A&capo=2", or empty in
// the song key without a capo. It is what the page's address holds, so a
// link to the sheet's other page can carry it.
export function keyQuery({
  shown,
  capo,
}: Pick<SheetKeyState, "shown" | "capo">): string {
  const query = new URLSearchParams();
  if (shown) query.set("key", keyName(shown));
  if (capo) query.set("capo", String(capo));
  return query.toString();
}

// Writes a value into the page's address, or, with null, takes it out,
// without a new entry in the history.
function useAddressParam(name: string, value: string | null) {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get(name) === value) return;
    if (value) url.searchParams.set(name, value);
    else url.searchParams.delete(name);
    window.history.replaceState(window.history.state, "", url);
  }, [name, value]);
}

// The sheet's key: the set key, or else guessed from its chords. Until the
// editor reports them, it comes from the loaded sheet, so the server
// renders the button too. `shown` and `capo` are the address's `key` and
// `capo`, read once; the address then follows them.
export function useSheetKey(
  sheet: ChordSheet,
  shown: string | null = null,
  capo: string | null = null,
): SheetKey {
  const [state, dispatch] = useReducer(sheetKeyReducer, null, () =>
    loadSheetKey(sheet, shown, capo),
  );

  useAddressParam("key", state.shown ? keyName(state.shown) : null);
  useAddressParam("capo", state.capo ? String(state.capo) : null);

  return {
    ...state,
    drawn: drawnKey(state),
    onChordsChange: (chords, key) => {
      dispatch({ type: "chords", chords, key });
    },
    show: (key, { keepCapo = false } = {}) => {
      dispatch({ type: "show", key, keepCapo });
    },
    setCapo: (fret) => {
      dispatch({ type: "capo", capo: fret });
    },
    reset: (next, fret = 0) => {
      dispatch({ type: "reset", sheet: next, capo: fret });
    },
  };
}

// The heading, and the key button for a sheet with chords. `children` comes
// after them, on the same line. The title is text, or on the sheet page the
// button or field that renames it.
export function SheetTitle({
  title,
  sheetKey: { key, guessed, guess, shown, capo, show, setCapo },
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
        // The key and the capo wrap together, after the title.
        <div className="editor-title-keys">
          <KeyButton
            current={current}
            song={key}
            guessed={guessed}
            guess={guess}
            readOnly={readOnly}
            onPick={(to) => {
              show(to);
            }}
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
              // The sheet sounds the same, so the capo stays.
              show(null, { keepCapo: true });
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
          <CapoButton sounding={current} capo={capo} onPick={setCapo} />
        </div>
      )}
      {children}
    </div>
  );
}
