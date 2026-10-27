import "./editor.css";

import { useEffect, useState } from "react";

import { EditorHelp } from "../editor/help";
import { SheetEditor } from "../editor/sheet-editor";
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
            <h1>{title}</h1>
            <div className="editor-note">
              <PrototypeNote />
            </div>
          </div>
          <SheetEditor sheet={seedSong} onEditedChange={setEdited} />
        </main>
        <SidePanel title="How to edit" before={<PrototypeNote />}>
          <EditorHelp />
        </SidePanel>
      </div>
    </>
  );
}
