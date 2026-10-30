import "./editor.css";

import {
  type ChordSheet,
  guessKey,
  type Key,
  stepKey,
  transposeChord,
} from "chordsheet";
import { useEffect, useRef, useState } from "react";

import { EditorHelp } from "../editor/help";
import { ImportButton } from "../editor/import-button";
import { KeyButton } from "../editor/key-button";
import { SheetEditor, type SheetEditorHandle } from "../editor/sheet-editor";
import { seedSong } from "../editor/seed-song";
import { SidePanel, SidePanelButton } from "../shell/side-panel";
import { TopBar } from "../shell/top-bar";
import { Note } from "../ui/note";

// The public editor (M2f). See openspec/specs/editor-page.

// The seed song's title. Sheets have no metadata yet.
const title = "Amazing Grace";

export function meta() {
  return [
    { title: `${title} | Sheet Library` },
    { name: "robots", content: "noindex" },
  ];
}

function PrototypeNote() {
  return (
    <Note>
      <span className="prototype-long">
        This is a prototype. Nothing is saved, and reloading starts over.
      </span>
      <span className="prototype-short">Prototype: nothing is saved.</span>
    </Note>
  );
}

function chordsOf(sheet: ChordSheet) {
  return sheet.sections.flatMap((s) => s.lines.flatMap((l) => l.chords));
}

export default function EditorPage() {
  // The sheet the editor loads, and how many imports came before it. The
  // count is the editor's key, so an import loads the new sheet in a new
  // editor, with a fresh undo history.
  const [loaded, setLoaded] = useState({ sheet: seedSong, imports: 0 });
  const [edited, setEdited] = useState(false);
  const editor = useRef<SheetEditorHandle>(null);
  // The key is guessed from the chords. Until the editor reports them, it is
  // guessed from the loaded sheet, so the server renders the button too.
  const [key, setKey] = useState(() => guessKey(chordsOf(seedSong)));
  // The key the sheet was loaded in, or the first one guessed. "Back" goes
  // there. Sheets don't store a key yet (#58).
  const [original, setOriginal] = useState(key);

  function load(sheet: ChordSheet) {
    const guess = guessKey(chordsOf(sheet));
    setLoaded(({ imports }) => ({ sheet, imports: imports + 1 }));
    setEdited(false);
    setKey(guess);
    setOriginal(guess);
  }

  // An imported sheet differs from the seed song, even before it is edited.
  const differs = edited || loaded.imports > 0;

  function moveTo(to: Key) {
    if (!key) return;
    editor.current?.transpose((c) => transposeChord(c, key, to));
  }

  // Nothing is saved, so leaving with edits or an import asks first, with the browser's
  // own prompt. The top bar's links load the next page in full, so the
  // prompt covers them too.
  useEffect(() => {
    if (!differs) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [differs]);

  return (
    <>
      <TopBar title={title}>
        <ImportButton onImport={load} />
        <SidePanelButton icon="help" title="How to edit">
          <EditorHelp />
        </SidePanelButton>
      </TopBar>
      <div className="editor-layout">
        <main className="editor-page">
          <div className="editor-intro">
            <div className="editor-title">
              <h1>{title}</h1>
              {key && original && (
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
            </div>
            <div className="editor-note">
              <PrototypeNote />
            </div>
          </div>
          <SheetEditor
            key={loaded.imports}
            ref={editor}
            sheet={loaded.sheet}
            sheetKey={key}
            onEditedChange={setEdited}
            onChordsChange={(chords) => {
              const guess = guessKey(chords);
              setKey(guess);
              setOriginal((first) => first ?? guess);
            }}
          />
        </main>
        <SidePanel title="How to edit" before={<PrototypeNote />}>
          <EditorHelp />
        </SidePanel>
      </div>
    </>
  );
}
