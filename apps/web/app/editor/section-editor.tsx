import "chord-editor/style.css";
import "./section-editor.css";

import {
  changeChord,
  chordsAt,
  createEditorState,
  docFromSection,
  findChord,
  type HandBack,
  handBackSection,
  insertChord,
  removeChord,
  selectChord,
} from "chord-editor";
import type { Section } from "chordsheet";
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

export interface SectionEditorHandle {
  handBack(): HandBack;
}

type ChordInput = { left: number; top: number } & (
  { kind: "new"; pos: number } | { kind: "edit"; id: string }
);

// Edits one section. The section is read once, when the editor is created;
// give the component a new key to load another one.
export function SectionEditor({
  section,
  ref,
}: {
  section: Section;
  ref?: Ref<SectionEditorHandle>;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const chordInputRef = useRef<ChordInput | null>(null);
  const sectionRef = useRef(section);
  const [chordInput, setChordInput] = useState<ChordInput | null>(null);

  useImperativeHandle(ref, () => ({
    handBack: () => {
      const view = viewRef.current;
      if (!view) throw new Error("The editor is not ready");
      return handBackSection(view.state.doc);
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
      state: createEditorState(docFromSection(sectionRef.current), {
        onChordShortcut,
        onChordClick: editChord,
      }),
    });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // The editor is created once. Its handlers only read refs.
  }, []);

  return (
    <div className="section-editor" ref={frameRef}>
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
