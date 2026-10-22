import "./editor.css";

import { SheetEditor } from "../editor/sheet-editor";
import { seedSong } from "../editor/seed-song";

// The public editor (M2f). See openspec/specs/editor-page.

export function meta() {
  return [
    { title: "Chord editor | Sheet Library" },
    { name: "robots", content: "noindex" },
  ];
}

export default function EditorPage() {
  return (
    <main className="editor-page">
      <h1>Chord editor</h1>
      <p>
        This is a prototype. Nothing is saved: reloading the page starts over.
      </p>
      <p className="hint">
        Click a section to edit it. Its toolbar adds a chord at the caret and
        moves the section up or down. Enter on an empty line starts a new
        section, Backspace at its start joins it with the one before, and Escape
        stops editing. Ctrl+K or Cmd+K adds a chord at the caret, or changes the
        one there. Click a chord to change or delete it, or drag it to move it.
      </p>
      <SheetEditor sheet={seedSong} />
    </main>
  );
}
