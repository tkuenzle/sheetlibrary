import "chord-editor/style.css";
import "./sheet-editor.css";

import {
  addChordAtCaret,
  type Anchor,
  changeChord,
  type Chord,
  chordsAt,
  chordsIn,
  createEditorState,
  docFromSheet,
  endEditing,
  findChord,
  type HandBack,
  handBackSheet,
  insertChord,
  type LabelBox,
  labelOf,
  moveActiveSection,
  redo,
  removeChord,
  type SectionToolbarState,
  selectChord,
  setSectionLabel,
  transposeChords,
  undo,
} from "chord-editor";
import {
  type ChordSheet,
  type ChordSymbol,
  type Key,
  type MarkedChord,
  writeMarkedChord,
} from "chordsheet";
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

import { phone } from "../breakpoints";
import { ChordInput } from "./chord-input";
import { SectionLabelField } from "./section-label-field";
import { SectionToolbar } from "./section-toolbar";

export interface SheetEditorHandle {
  handBack(): HandBack;
  // Moves every chord with `move`, in one step to undo.
  transpose(move: (chord: MarkedChord) => MarkedChord): void;
  undo(): void;
  redo(): void;
}

// When the layout is compact: on a touch device, or in a phone-wide window,
// too narrow for the section toolbar beside the section. The toolbar then
// docks at the bottom.
const compact = `(pointer: coarse), ${phone}`;
const reducedMotion = "(prefers-reduced-motion: reduce)";

type ChordTarget =
  | { kind: "new"; pos: number }
  | { kind: "edit"; id: string; chord: MarkedChord };

// The chord input while it is open: what it adds or edits, where it goes,
// and what it suggests from.
type OpenChordInput = ChordTarget & {
  left: number;
  top: number;
  docked: boolean;
  initial: string;
  sheetChords: ChordSymbol[];
  // Counts the openings, so each one starts the input afresh.
  opening: number;
};

// The label field of the section at `pos`, over its label.
interface LabelField {
  pos: number;
  left: number;
  top: number;
  height: number;
  initial: string;
}

// Edits a sheet, one active section at a time. The sheet is read once, when
// the editor is created; give the component a new key to load another one.
export function SheetEditor({
  sheet,
  onEditedChange,
  onChordsChange,
  sheetKey = null,
  ref,
}: {
  sheet: ChordSheet;
  // Called when the sheet starts or stops differing from the one loaded.
  onEditedChange?: (edited: boolean) => void;
  // Called with every chord in order, once the editor is ready and then
  // whenever a chord changes.
  onChordsChange?: (chords: Chord[]) => void;
  // The sheet's key, for the chord input's suggestions.
  sheetKey?: Key | null;
  ref?: Ref<SheetEditorHandle>;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);
  const labelFieldRef = useRef<LabelField | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const chordInputRef = useRef<OpenChordInput | null>(null);
  const openings = useRef(0);
  const sheetRef = useRef(sheet);
  const onEditedChangeRef = useRef(onEditedChange);
  const onChordsChangeRef = useRef(onChordsChange);
  const [chordInput, setChordInput] = useState<OpenChordInput | null>(null);
  // A docked chord input that closed and is sliding out of view.
  const [leaving, setLeaving] = useState<OpenChordInput | null>(null);
  const [toolbar, setToolbar] = useState<SectionToolbarState | null>(null);
  const [labelField, setLabelField] = useState<LabelField | null>(null);

  useEffect(() => {
    onEditedChangeRef.current = onEditedChange;
    onChordsChangeRef.current = onChordsChange;
  });

  useImperativeHandle(ref, () => ({
    handBack: () => {
      const view = viewRef.current;
      if (!view) throw new Error("The editor is not ready");
      return handBackSheet(view.state.doc);
    },
    transpose: (move) => {
      run(transposeChords(move));
    },
    undo: () => {
      run(undo);
    },
    redo: () => {
      run(redo);
    },
  }));

  function run(command: Command) {
    const view = viewRef.current;
    if (view) command(view.state, view.dispatch, view);
  }

  function showInput(next: OpenChordInput | null) {
    const current = chordInputRef.current;
    chordInputRef.current = next;
    // Render the input right away, so focusing it still counts as part of
    // the tap. Otherwise iOS doesn't open the keyboard.
    flushSync(() => {
      setChordInput(next);
      setLeaving(
        !next && current?.docked && !matchMedia(reducedMotion).matches
          ? current
          : null,
      );
    });
  }

  function openInput(
    target: ChordTarget,
    place: { left: number; top: number },
  ) {
    const view = viewRef.current;
    if (!view) return;
    keepLabel();
    openings.current++;
    showInput({
      ...target,
      ...place,
      docked: window.matchMedia(compact).matches,
      initial: target.kind === "edit" ? writeMarkedChord(target.chord) : "",
      sheetChords: chordsIn(view.state.doc),
      opening: openings.current,
    });
    run(selectChord(target.kind === "edit" ? target.id : null));
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    input.select();
  }

  function closeInput() {
    showInput(null);
    run(selectChord(null));
    viewRef.current?.focus();
  }

  // Adds the chord, or changes the one being edited to it. Null adds
  // nothing, and removes a chord being edited.
  function commitInput(chord: MarkedChord | null) {
    const current = chordInputRef.current;
    if (current?.kind === "new" && chord) run(insertChord(current.pos, chord));
    if (current?.kind === "edit") {
      run(chord ? changeChord(current.id, chord) : removeChord(current.id));
    }
    closeInput();
  }

  function showLabelField(next: LabelField | null) {
    labelFieldRef.current = next;
    // Rendered right away, so focusing the field still counts as part of
    // the tap, and iOS opens the keyboard.
    flushSync(() => {
      setLabelField(next);
    });
  }

  function openLabelField(next: LabelField) {
    if (chordInputRef.current) closeInput();
    showLabelField(next);
    labelInputRef.current?.focus();
    labelInputRef.current?.select();
  }

  // Closes the label field, keeping `label` if given, and gives the focus
  // back to the editor, where the caret still is.
  function closeLabelField(label?: string) {
    const current = labelFieldRef.current;
    if (!current) return;
    showLabelField(null);
    if (label !== undefined) run(setSectionLabel(current.pos, label));
    viewRef.current?.focus();
  }

  // Keeps what the label field holds, as a click elsewhere does.
  function keepLabel() {
    const input = labelInputRef.current;
    if (labelFieldRef.current && input) closeLabelField(input.value);
  }

  function deleteChord() {
    const current = chordInputRef.current;
    if (current?.kind === "edit") run(removeChord(current.id));
    closeInput();
  }

  // The letter the open chord input adds to, or of the chord it edits, in
  // window coordinates.
  function letterBox() {
    const view = viewRef.current;
    const current = chordInputRef.current;
    if (!view || !current) return null;
    const pos =
      current.kind === "new"
        ? current.pos
        : findChord(view.state.doc, current.id)?.pos;
    return pos === undefined ? null : view.coordsAtPos(pos);
  }

  // The form is measured once drawn and moved left if it would stick out. A
  // form past the window's edge widens the page on phones, which moves the
  // docked toolbar.
  useLayoutEffect(() => {
    const form = formRef.current;
    const frame = frameRef.current;
    if (!form || !frame || !chordInput || chordInput.docked) return;
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
      openInput({ kind: "edit", id, chord: found.chord }, placeBelow(anchor));
    }

    // Ctrl+K or Cmd+K edits the first chord on the letter after the caret,
    // or adds one if it has none.
    const onChordShortcut = (pos: number, anchor: Anchor) => {
      const [first] = chordsAt(view.state.doc, pos);
      if (first) editChord(first.id, anchor);
      else openInput({ kind: "new", pos }, placeBelow(anchor));
    };

    // Over the label or "Add label" the editor points to.
    function onLabelClick(pos: number, box: LabelBox) {
      const frame = frameRef.current?.getBoundingClientRect();
      const section = view.state.doc.nodeAt(pos);
      if (!frame || !section) return;
      openLabelField({
        pos,
        left: box.left - frame.left,
        top: box.top - frame.top,
        height: box.height,
        initial: labelOf(section) ?? "",
      });
    }

    const loaded = docFromSheet(sheetRef.current);
    let edited = false;
    // The chords as last reported, to report only when they change.
    let reported = "";
    function reportChords(doc: typeof loaded) {
      const chords = chordsIn(doc);
      const now = JSON.stringify(chords);
      if (now === reported) return;
      reported = now;
      onChordsChangeRef.current?.(chords);
    }
    const view = new EditorView(mount, {
      state: createEditorState(loaded, {
        toolbar: toolbarRef.current ?? undefined,
        // Rendered right away: the editor places the toolbar right after
        // this, and the old buttons must not show in the new place.
        onSectionToolbar: (next) => {
          flushSync(() => {
            setToolbar(next);
          });
        },
        compact,
        onChordShortcut,
        onChordClick: editChord,
        onLabelClick,
        // A click below the lyrics adds a chord to the letter above it, and
        // so does "Add chord" in the toolbar, at the caret.
        onAddChord: (pos, anchor) => {
          openInput({ kind: "new", pos }, placeBelow(anchor));
        },
        // Dragging a chord cancels the chord input.
        onDragStart: () => {
          if (chordInputRef.current) closeInput();
        },
      }),
      dispatchTransaction: (tr) => {
        const state = view.state.apply(tr);
        view.updateState(state);
        if (!tr.docChanged) return;
        reportChords(state.doc);
        // Undoing back to the loaded sheet counts as not edited.
        const now = !state.doc.eq(loaded);
        if (now === edited) return;
        edited = now;
        onEditedChangeRef.current?.(now);
      },
    });
    viewRef.current = view;
    reportChords(view.state.doc);

    // A click outside the sheet ends editing. The chord input and the chord
    // labels are inside it. It waits for the click, not the press: clean-up
    // can shrink the sheet and move a button away from under the pointer.
    // The event's path is checked, not its target: the chord input's buttons
    // close it, so they are gone from the page by the time the click gets here.
    // Controls marked data-keeps-editing, such as the help, keep editing.
    function onClick(event: MouseEvent) {
      const frame = frameRef.current;
      const path = event.composedPath();
      if (frame && path.includes(frame)) return;
      if (
        path.some(
          (target) =>
            target instanceof Element &&
            target.hasAttribute("data-keeps-editing"),
        )
      ) {
        return;
      }
      if (chordInputRef.current) {
        showInput(null);
        run(selectChord(null));
      }
      // The field kept its text when it lost the focus to this click.
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

  const shownInput = chordInput ?? leaving;

  return (
    <div
      className="sheet-editor"
      ref={frameRef}
      data-editing-label={labelField ? "" : undefined}
    >
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
      {labelField && (
        <SectionLabelField
          ref={labelInputRef}
          left={labelField.left}
          top={labelField.top}
          height={labelField.height}
          initial={labelField.initial}
          onKeep={closeLabelField}
          onCancel={() => {
            closeLabelField();
          }}
        />
      )}
      {shownInput && (
        <ChordInput
          // The same key while it slides out, so it keeps its text.
          key={shownInput.opening}
          inputRef={inputRef}
          formRef={formRef}
          left={shownInput.left}
          top={shownInput.top}
          docked={shownInput.docked}
          closing={!chordInput}
          initial={shownInput.initial}
          editing={shownInput.kind === "edit" ? shownInput.chord : null}
          sheetChords={shownInput.sheetChords}
          sheetKey={sheetKey}
          letterBox={letterBox}
          onCommit={commitInput}
          onRemove={deleteChord}
          onCancel={closeInput}
          onClosed={() => {
            setLeaving(null);
          }}
        />
      )}
    </div>
  );
}
