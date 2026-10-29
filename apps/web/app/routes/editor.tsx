import "./editor.css";

import { guessKey, type Key, stepKey, transposeChord } from "chordsheet";
import { useEffect, useRef, useState } from "react";

import { EditorHelp } from "../editor/help";
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

export default function EditorPage() {
  const [edited, setEdited] = useState(false);
  const editor = useRef<SheetEditorHandle>(null);
  // The key is guessed from the chords. Until the editor reports them, it is
  // guessed from the seed song, so the server renders the button too.
  const [key, setKey] = useState(() =>
    guessKey(
      seedSong.sections.flatMap((s) => s.lines.flatMap((l) => l.chords)),
    ),
  );
  // The key the sheet was loaded in, or the first one guessed. "Back" goes
  // there. Sheets don't store a key yet (#58).
  const [original, setOriginal] = useState(key);

  function moveTo(to: Key) {
    if (!key) return;
    editor.current?.transpose((c) => transposeChord(c, key, to));
  }

  // Nothing is saved, so leaving with edits asks first, with the browser's
  // own prompt. The top bar's links load the next page in full, so the
  // prompt covers them too.
  useEffect(() => {
    if (!edited) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [edited]);

  return (
    <>
      <TopBar title={title}>
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
            ref={editor}
            sheet={seedSong}
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
