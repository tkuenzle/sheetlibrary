import "./sheet-editor.css";

import type { ChordSheet, Problem } from "chordsheet";
import { type CSSProperties, useRef, useState } from "react";
import { useSearchParams } from "react-router";

import { SheetEditor, type SheetEditorHandle } from "../editor/sheet-editor";
import { seedSong } from "../editor/seed-song";

// A test page for the sheet editor (M2c). See openspec/specs/chord-editor.

export function meta() {
  return [
    { title: "Sheet editor | Sheet Library" },
    { name: "robots", content: "noindex" },
  ];
}

type Page =
  | { kind: "editing"; sheet: ChordSheet; problems: Problem[] }
  | { kind: "done"; sheet: ChordSheet };

export default function SheetEditorPage() {
  // `?lift=5em` sets how far a chord dragged by touch is lifted, to try
  // values on a phone.
  const [params] = useSearchParams();
  const lift = params.get("lift");
  const style = lift
    ? ({ "--chord-editor-touch-lift": lift } as CSSProperties)
    : undefined;
  const editorRef = useRef<SheetEditorHandle>(null);
  // Each new editor gets a new key, so it loads its sheet.
  const [key, setKey] = useState(0);
  const [page, setPage] = useState<Page>({
    kind: "editing",
    sheet: seedSong,
    problems: [],
  });

  function done() {
    if (page.kind !== "editing") return;
    const result = editorRef.current?.handBack();
    if (!result) return;
    if (result.ok) setPage({ kind: "done", sheet: result.sheet });
    else setPage({ ...page, problems: result.problems });
  }

  function edit() {
    if (page.kind !== "done") return;
    setKey(key + 1);
    setPage({ kind: "editing", sheet: page.sheet, problems: [] });
  }

  return (
    <main className="sheet-editor-page" style={style}>
      <h1>Sheet editor</h1>
      {page.kind === "editing" ? (
        <>
          <p className="hint">
            Click a section to edit it. Enter on an empty line starts a new
            section, Backspace at its start joins it with the one before, and
            Escape stops editing. Ctrl+K or Cmd+K adds a chord at the caret, or
            changes the one there. Click a chord to change or delete it, or drag
            it to move it.
          </p>
          <SheetEditor key={key} ref={editorRef} sheet={page.sheet} />
          {page.problems.length > 0 && (
            <ul className="problems" aria-label="Problems">
              {page.problems.map((problem, index) => (
                <li key={index}>{problem.message}</li>
              ))}
            </ul>
          )}
          <button type="button" onClick={done}>
            Done
          </button>
        </>
      ) : (
        <>
          <p className="hint">The sheet as it is stored.</p>
          <pre data-testid="sheet">{JSON.stringify(page.sheet, null, 2)}</pre>
          <button type="button" onClick={edit}>
            Edit
          </button>
        </>
      )}
    </main>
  );
}
