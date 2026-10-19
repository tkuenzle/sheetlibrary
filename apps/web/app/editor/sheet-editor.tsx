import "chord-editor/style.css";
import "./sheet-editor.css";

import {
  changeChord,
  chordsAt,
  createEditorState,
  docFromSheet,
  endEditing,
  findChord,
  type HandBack,
  handBackSheet,
  insertChord,
  removeChord,
  selectChord,
} from "chord-editor";
import type { ChordSheet } from "chordsheet";
import type { Command } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import {
  type Ref,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";

export interface SheetEditorHandle {
  handBack(): HandBack;
}

type ChordInput = { left: number; top: number } & (
  { kind: "new"; pos: number } | { kind: "edit"; id: string }
);

// Edits a sheet, one active section at a time. The sheet is read once, when
// the editor is created; give the component a new key to load another one.
export function SheetEditor({
  sheet,
  ref,
}: {
  sheet: ChordSheet;
  ref?: Ref<SheetEditorHandle>;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const chordInputRef = useRef<ChordInput | null>(null);
  const sheetRef = useRef(sheet);
  const [chordInput, setChordInput] = useState<ChordInput | null>(null);

  useImperativeHandle(ref, () => ({
    handBack: () => {
      const view = viewRef.current;
      if (!view) throw new Error("The editor is not ready");
      return handBackSheet(view.state.doc);
    },
  }));

  function run(command: Command) {
    const view = viewRef.current;
    if (view) command(view.state, view.dispatch, view);
  }

  function showInput(next: ChordInput | null) {
    chordInputRef.current = next;
    // Render the input right away, so focusing it still counts as part of
    // the tap. Otherwise iOS doesn't open the keyboard.
    flushSync(() => {
      setChordInput(next);
    });
  }

  function openInput(next: ChordInput, value: string) {
    showInput(next);
    run(selectChord(next.kind === "edit" ? next.id : null));
    const input = inputRef.current;
    if (!input) return;
    input.value = value;
    input.focus();
    input.select();
  }

  function closeInput() {
    showInput(null);
    run(selectChord(null));
    viewRef.current?.focus();
  }

  function commitInput() {
    const current = chordInputRef.current;
    const chord = inputRef.current?.value.trim() ?? "";
    if (current?.kind === "new" && chord) run(insertChord(current.pos, chord));
    if (current?.kind === "edit") {
      run(chord ? changeChord(current.id, chord) : removeChord(current.id));
    }
    closeInput();
  }

  function deleteChord() {
    const current = chordInputRef.current;
    if (current?.kind === "edit") run(removeChord(current.id));
    closeInput();
  }

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    function placeBelow(pos: number) {
      const coords = view.coordsAtPos(pos);
      const frame = frameRef.current?.getBoundingClientRect();
      if (!frame) return { left: 0, top: 0 };
      const left = Math.min(coords.left - frame.left, frame.width - 240);
      return { left: Math.max(0, left), top: coords.bottom - frame.top + 4 };
    }

    function editChord(id: string) {
      const found = findChord(view.state.doc, id);
      if (!found) return;
      openInput(
        { kind: "edit", id, ...placeBelow(found.pos) },
        found.chord.chord,
      );
    }

    // Ctrl+K or Cmd+K edits the first chord on the letter after the caret,
    // or adds one if it has none.
    const onChordShortcut = (pos: number) => {
      const [first] = chordsAt(view.state.doc, pos);
      if (first) editChord(first.id);
      else openInput({ kind: "new", pos, ...placeBelow(pos) }, "");
    };

    const view = new EditorView(mount, {
      state: createEditorState(docFromSheet(sheetRef.current), {
        onChordShortcut,
        onChordClick: editChord,
        // Dragging a chord cancels the chord input.
        onDragStart: () => {
          if (chordInputRef.current) closeInput();
        },
      }),
    });
    viewRef.current = view;

    // A click outside the sheet ends editing. The chord input and the chord
    // labels are inside it. It waits for the click, not the press: clean-up
    // can shrink the sheet and move a button away from under the pointer.
    // The event's path is checked, not its target: the chord input's buttons
    // close it, so they are gone from the page by the time the click gets here.
    function onClick(event: MouseEvent) {
      const frame = frameRef.current;
      if (frame && event.composedPath().includes(frame)) return;
      if (chordInputRef.current) {
        showInput(null);
        run(selectChord(null));
      }
      endEditing(view.state, view.dispatch, view);
    }
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      view.destroy();
      viewRef.current = null;
    };
    // The editor is created once. Its handlers only read refs.
  }, []);

  return (
    <div className="sheet-editor" ref={frameRef}>
      <div className="chord-editor" ref={mountRef} data-testid="editor" />
      {chordInput && (
        <form
          className="chord-input"
          style={{ left: chordInput.left, top: chordInput.top }}
          onSubmit={(event) => {
            event.preventDefault();
            commitInput();
          }}
        >
          <input
            ref={inputRef}
            aria-label="Chord"
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            onKeyDown={(event) => {
              if (event.key === "Escape") closeInput();
            }}
          />
          <button type="submit">OK</button>
          {chordInput.kind === "edit" && (
            <button type="button" onClick={deleteChord}>
              Delete
            </button>
          )}
          <button type="button" onClick={closeInput}>
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}
