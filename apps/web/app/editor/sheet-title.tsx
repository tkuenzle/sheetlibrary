import {
  type ChordSheet,
  guessKey,
  type Key,
  stepKey,
  transposeChord,
} from "chordsheet";
import { type ReactNode, type RefObject, useState } from "react";

import { KeyButton } from "./key-button";
import type { SheetEditorHandle } from "./sheet-editor";

// The sheet's heading with its key button, shared by the pages that edit a
// sheet. See openspec/specs/editor-page.

function chordsOf(sheet: ChordSheet) {
  return sheet.sections.flatMap((s) => s.lines.flatMap((l) => l.chords));
}

export interface SheetKey {
  // The key guessed from the chords now.
  key: Key | null;
  // The key the sheet was loaded in, or the first one guessed. "Back" goes
  // there. Sheets don't store a key yet (#58).
  original: Key | null;
  // Pass to the editor's onChordsChange.
  onChordsChange: (chords: Parameters<typeof guessKey>[0]) => void;
  // Starts over with a newly loaded sheet.
  reset: (sheet: ChordSheet) => void;
}

// The sheet's key, guessed from its chords. Until the editor reports them,
// it is guessed from the loaded sheet, so the server renders the button too.
export function useSheetKey(sheet: ChordSheet): SheetKey {
  const [key, setKey] = useState(() => guessKey(chordsOf(sheet)));
  const [original, setOriginal] = useState(key);
  return {
    key,
    original,
    onChordsChange: (chords) => {
      const guess = guessKey(chords);
      setKey(guess);
      setOriginal((first) => first ?? guess);
    },
    reset: (next) => {
      const guess = guessKey(chordsOf(next));
      setKey(guess);
      setOriginal(guess);
    },
  };
}

// The heading, and the key button for a sheet with chords. `children` comes
// after them, on the same line.
export function SheetTitle({
  title,
  sheetKey: { key, original },
  editor,
  readOnly = false,
  children,
}: {
  title: string;
  sheetKey: SheetKey;
  editor: RefObject<SheetEditorHandle | null>;
  // A read-only sheet can't be transposed, so it has no key button.
  readOnly?: boolean;
  children?: ReactNode;
}) {
  function moveTo(to: Key) {
    if (!key) return;
    editor.current?.transpose((c) => transposeChord(c, key, to));
  }

  return (
    <div className="editor-title">
      <h1>{title}</h1>
      {key && original && !readOnly && (
        <KeyButton
          current={key}
          original={original}
          onPick={moveTo}
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
