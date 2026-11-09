import "./editor.css";

import type { ChordSheet } from "chordsheet";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";

import { EditorHelp } from "../editor/help";
import { ImportButton } from "../editor/import-button";
import { SheetEditor, type SheetEditorHandle } from "../editor/sheet-editor";
import { SheetTitle, useSheetKey } from "../editor/sheet-title";
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
  // The sheet the editor loads, and how many imports came before it. The
  // count is the editor's key, so an import loads the new sheet in a new
  // editor, with a fresh undo history.
  const [loaded, setLoaded] = useState({ sheet: seedSong, imports: 0 });
  const [edited, setEdited] = useState(false);
  const editor = useRef<SheetEditorHandle>(null);
  const [searchParams] = useSearchParams();
  const sheetKey = useSheetKey(
    seedSong,
    searchParams.get("key"),
    searchParams.get("capo"),
  );

  // Uses the import right away, so the dialog closes (see ImportButton).
  function load(sheet: ChordSheet, capo: number): undefined {
    setLoaded(({ imports }) => ({ sheet, imports: imports + 1 }));
    setEdited(false);
    sheetKey.reset(sheet, capo);
  }

  // An imported sheet differs from the seed song, even before it is edited.
  const differs = edited || loaded.imports > 0;

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
      <TopBar>
        <ImportButton
          onImport={load}
          note="Importing replaces the sheet on this page. It can’t be undone."
        />
        <SidePanelButton icon="help" title="How to edit">
          <EditorHelp />
        </SidePanelButton>
      </TopBar>
      <div className="editor-layout">
        <main className="editor-page">
          <div className="editor-intro">
            <SheetTitle title={title} sheetKey={sheetKey} editor={editor} />
            <div className="editor-note">
              <PrototypeNote />
            </div>
          </div>
          <SheetEditor
            key={loaded.imports}
            ref={editor}
            sheet={loaded.sheet}
            sheetKey={sheetKey.key}
            shownKey={sheetKey.drawn}
            onEditedChange={setEdited}
            onChordsChange={sheetKey.onChordsChange}
          />
        </main>
        <SidePanel title="How to edit" before={<PrototypeNote />}>
          <EditorHelp />
        </SidePanel>
      </div>
    </>
  );
}
