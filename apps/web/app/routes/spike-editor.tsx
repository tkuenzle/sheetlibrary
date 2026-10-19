import "prosemirror-view/style/prosemirror.css";
import "../spike/spike.css";

import { redo, undo } from "prosemirror-history";
import type { Command } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

import { docToChordPro } from "../spike/chordpro";
import {
  findChord,
  insertChord,
  moveChord,
  removeChord,
  renameChord,
  selectChord,
} from "../spike/chords";
import { createEditorState } from "../spike/editor";
import { letterAt } from "../spike/letter";
import { seedSong } from "../spike/song";

// Throwaway editor spike (M1). See openspec/changes/editor-spike.

export function meta() {
  return [
    { title: "Editor spike | Sheet Library" },
    { name: "robots", content: "noindex" },
  ];
}

type Mode = "text" | "chords";

type ChordInput = { left: number; top: number } & (
  { kind: "new"; pos: number } | { kind: "edit"; id: string }
);

export default function EditorSpike() {
  const frameRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const modeRef = useRef<Mode>("text");
  const chordInputRef = useRef<ChordInput | null>(null);
  const newStateRef = useRef(() => createEditorState(seedSong));
  const [mode, setMode] = useState<Mode>("text");
  const [chordInput, setChordInput] = useState<ChordInput | null>(null);
  const [chordPro, setChordPro] = useState(seedSong);

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

  function openInput(next: ChordInput, value: string, focus: boolean) {
    showInput(next);
    const input = inputRef.current;
    if (!input) return;
    input.value = value;
    if (focus) {
      input.focus();
      input.select();
    }
  }

  function closeInput() {
    showInput(null);
    run(selectChord(null));
    if (modeRef.current === "text") viewRef.current?.focus();
  }

  function placeBelow(view: EditorView, pos: number) {
    const coords = view.coordsAtPos(pos);
    const frame = frameRef.current?.getBoundingClientRect();
    if (!frame) return { left: 0, top: 0 };
    const left = Math.min(coords.left - frame.left, frame.width - 240);
    return { left: Math.max(0, left), top: coords.bottom - frame.top + 4 };
  }

  function commitInput() {
    const current = chordInputRef.current;
    const name = inputRef.current?.value.trim() ?? "";
    if (current?.kind === "new" && name) run(insertChord(current.pos, name));
    if (current?.kind === "edit") {
      run(name ? renameChord(current.id, name) : removeChord(current.id));
    }
    closeInput();
  }

  function deleteSelectedChord() {
    const current = chordInputRef.current;
    if (current?.kind === "edit") run(removeChord(current.id));
    closeInput();
  }

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const openAtCaret: Command = (state, _dispatch, view) => {
      if (!view) return false;
      const pos = state.selection.head;
      openInput({ kind: "new", pos, ...placeBelow(view, pos) }, "", true);
      return true;
    };

    // A tap on a chord in chord mode selects it for editing.
    const onChordClick = (id: string) => {
      if (modeRef.current !== "chords") return;
      const found = findChord(view.state.doc, id);
      if (!found) return;
      run(selectChord(id));
      openInput(
        { kind: "edit", id, ...placeBelow(view, found.pos) },
        found.chord.name,
        matchMedia("(pointer: fine)").matches,
      );
    };
    const onChordDrop = (id: string, pos: number) => {
      run(moveChord(id, pos));
    };

    newStateRef.current = () =>
      createEditorState(seedSong, {
        onChordShortcut: openAtCaret,
        onChordClick,
        onChordDrop,
      });
    const view = new EditorView(mount, {
      state: newStateRef.current(),
      editable: () => modeRef.current === "text",
      dispatchTransaction(tr) {
        const state = view.state.apply(tr);
        view.updateState(state);
        if (tr.docChanged) setChordPro(docToChordPro(state.doc));
      },
    });
    viewRef.current = view;

    // In chord mode the lyrics can't be edited. A tap on a letter adds a
    // chord there or moves the selected chord.
    const onClick = (event: MouseEvent) => {
      if (modeRef.current !== "chords") return;
      const pos = letterAt(view, event.clientX, event.clientY);
      if (pos === null) return;
      const current = chordInputRef.current;
      if (current?.kind === "edit") {
        run(moveChord(current.id, pos));
        closeInput();
      } else {
        openInput({ kind: "new", pos, ...placeBelow(view, pos) }, "", true);
      }
    };
    view.dom.addEventListener("click", onClick);

    return () => {
      view.dom.removeEventListener("click", onClick);
      view.destroy();
      viewRef.current = null;
    };
    // The editor is created once. Its handlers only read refs.
  }, []);

  function switchMode(next: Mode) {
    modeRef.current = next;
    setMode(next);
    showInput(null);
    run(selectChord(null));
    viewRef.current?.setProps({});
  }

  function reset() {
    viewRef.current?.updateState(newStateRef.current());
    setChordPro(seedSong);
    showInput(null);
  }

  return (
    <main className="spike" data-mode={mode}>
      <h1>Editor spike</h1>
      <div className="spike-toolbar">
        <button
          type="button"
          aria-pressed={mode === "text"}
          onClick={() => {
            switchMode("text");
          }}
        >
          Text
        </button>
        <button
          type="button"
          aria-pressed={mode === "chords"}
          onClick={() => {
            switchMode("chords");
          }}
        >
          Chords
        </button>
        <button
          type="button"
          onClick={() => {
            run(undo);
          }}
        >
          Undo
        </button>
        <button
          type="button"
          onClick={() => {
            run(redo);
          }}
        >
          Redo
        </button>
        <button type="button" onClick={reset}>
          Reset
        </button>
      </div>
      <p className="spike-hint">
        {mode === "text"
          ? "Edit the lyrics. Ctrl+K or Cmd+K adds a chord at the caret. Drag a chord to move it."
          : "Tap a letter to add a chord. Tap a chord to change or delete it. Drag a chord to move it."}
      </p>
      <div className="spike-frame" ref={frameRef}>
        <div className="spike-editor" ref={mountRef} data-testid="editor" />
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
              <button type="button" onClick={deleteSelectedChord}>
                Delete
              </button>
            )}
            <button type="button" onClick={closeInput}>
              Cancel
            </button>
          </form>
        )}
      </div>
      {chordInput?.kind === "edit" && (
        <p className="spike-hint">Tap a letter to move the chord there.</p>
      )}
      <details>
        <summary>ChordPro</summary>
        <pre data-testid="chordpro">{chordPro}</pre>
      </details>
    </main>
  );
}
