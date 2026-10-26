import "chord-editor/style.css";
import "./sheet-editor.css";

import {
  addChordAtCaret,
  type Anchor,
  changeChord,
  chordsAt,
  createEditorState,
  docFromSheet,
  endEditing,
  findChord,
  type HandBack,
  handBackSheet,
  insertChord,
  moveActiveSection,
  removeChord,
  type SectionToolbarState,
  selectChord,
} from "chord-editor";
import type { ChordSheet } from "chordsheet";
import type { Command } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import {
  type Ref,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";

import { Button } from "../ui/button";
import { Popover } from "../ui/popover";
import { SectionToolbar } from "./section-toolbar";

export interface SheetEditorHandle {
  handBack(): HandBack;
}

// When the layout is compact: on a touch device, or in a window too narrow
// for the section toolbar beside the section. The toolbar then docks at the
// bottom. Only in a phone-wide window do the badges also move above the
// lyrics (see sheet-editor.css).
const compact = "(pointer: coarse), (max-width: 640px)";

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
  const formRef = useRef<HTMLFormElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const chordInputRef = useRef<ChordInput | null>(null);
  const sheetRef = useRef(sheet);
  const [chordInput, setChordInput] = useState<ChordInput | null>(null);
  const [toolbar, setToolbar] = useState<SectionToolbarState | null>(null);

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

  // The form is wider when it edits a chord, so it is measured once drawn
  // and moved left if it would stick out. A form past the window's edge
  // widens the page on phones, which moves the docked toolbar.
  useLayoutEffect(() => {
    const form = formRef.current;
    const frame = frameRef.current;
    if (!form || !frame || !chordInput) return;
    const max = Math.max(0, frame.clientWidth - form.offsetWidth);
    form.style.left = `${String(Math.min(chordInput.left, max))}px`;
  }, [chordInput]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Below the letter the editor points to. Kept inside the editor's width
    // once the form is drawn.
    function placeBelow(anchor: Anchor) {
      const frame = frameRef.current?.getBoundingClientRect();
      if (!frame) return { left: 0, top: 0 };
      return {
        left: Math.max(0, anchor.left - frame.left),
        top: anchor.bottom - frame.top + 4,
      };
    }

    function editChord(id: string, anchor: Anchor) {
      const found = findChord(view.state.doc, id);
      if (!found) return;
      openInput({ kind: "edit", id, ...placeBelow(anchor) }, found.chord.chord);
    }

    // Ctrl+K or Cmd+K edits the first chord on the letter after the caret,
    // or adds one if it has none.
    const onChordShortcut = (pos: number, anchor: Anchor) => {
      const [first] = chordsAt(view.state.doc, pos);
      if (first) editChord(first.id, anchor);
      else openInput({ kind: "new", pos, ...placeBelow(anchor) }, "");
    };

    const view = new EditorView(mount, {
      state: createEditorState(docFromSheet(sheetRef.current), {
        toolbar: toolbarRef.current ?? undefined,
        onSectionToolbar: setToolbar,
        compact,
        onChordShortcut,
        onChordClick: editChord,
        // A click below the lyrics adds a chord to the letter above it, and
        // so does "Add chord" in the toolbar, at the caret.
        onAddChord: (pos, anchor) => {
          openInput({ kind: "new", pos, ...placeBelow(anchor) }, "");
        },
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
      <SectionToolbar
        ref={toolbarRef}
        state={toolbar}
        onAddChord={() => {
          if (viewRef.current) addChordAtCaret(viewRef.current);
        }}
        onMove={(direction) => {
          if (viewRef.current) moveActiveSection(viewRef.current, direction);
        }}
      />
      {chordInput && (
        <form
          ref={formRef}
          className="chord-input"
          style={{ left: chordInput.left, top: chordInput.top }}
          onSubmit={(event) => {
            event.preventDefault();
            commitInput();
          }}
        >
          <Popover>
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
            <Button type="submit" size="small">
              OK
            </Button>
            {chordInput.kind === "edit" && (
              <Button variant="text" size="small" onClick={deleteChord}>
                Delete
              </Button>
            )}
            <Button variant="text" size="small" onClick={closeInput}>
              Cancel
            </Button>
          </Popover>
        </form>
      )}
    </div>
  );
}
