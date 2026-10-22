import "../app/app.css";
import "./harness.css";

import type { ChordSheet, Problem } from "chordsheet";
import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import {
  SheetEditor,
  type SheetEditorHandle,
} from "../app/editor/sheet-editor";
import { seedSong } from "../app/editor/seed-song";

// The page the editor's Playwright tests run against (e2e/sheet-editor.spec.ts).
// It is built on its own (vite.harness.config.ts) and never deployed. Done
// shows the sheet the editor hands back, so the tests can check it.

type Page =
  | { kind: "editing"; sheet: ChordSheet; problems: Problem[] }
  | { kind: "done"; sheet: ChordSheet };

function Harness() {
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
    <main className="harness">
      <h1>Sheet editor harness</h1>
      {page.kind === "editing" ? (
        <>
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
          <pre data-testid="sheet">{JSON.stringify(page.sheet, null, 2)}</pre>
          <button type="button" onClick={edit}>
            Edit
          </button>
        </>
      )}
    </main>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("No #root element");
createRoot(root).render(<Harness />);
