import "./section-editor.css";

import type { Problem, Section } from "chordsheet";
import { useRef, useState } from "react";

import {
  SectionEditor,
  type SectionEditorHandle,
} from "../editor/section-editor";
import { seedSong } from "../editor/seed-song";

// A test page for the section editor (M2b). See
// openspec/changes/section-editor.

export function meta() {
  return [
    { title: "Section editor | Sheet Library" },
    { name: "robots", content: "noindex" },
  ];
}

const firstSection: Section = seedSong.sections[0] ?? { lines: [] };

type Page =
  | { kind: "editing"; section: Section; problems: Problem[] }
  // No section means that nothing was left.
  | { kind: "done"; section: Section | undefined };

export default function SectionEditorPage() {
  const editorRef = useRef<SectionEditorHandle>(null);
  // Each new editor gets a new key, so it loads its section.
  const [key, setKey] = useState(0);
  const [page, setPage] = useState<Page>({
    kind: "editing",
    section: firstSection,
    problems: [],
  });

  function done() {
    if (page.kind !== "editing") return;
    const result = editorRef.current?.handBack();
    if (!result) return;
    if (result.ok) setPage({ kind: "done", section: result.section });
    else setPage({ ...page, problems: result.problems });
  }

  function edit() {
    if (page.kind !== "done") return;
    setKey(key + 1);
    setPage({
      kind: "editing",
      section: page.section ?? { lines: [] },
      problems: [],
    });
  }

  return (
    <main className="section-editor-page">
      <h1>Section editor</h1>
      {page.kind === "editing" ? (
        <>
          <p className="hint">
            Ctrl+K or Cmd+K adds a chord at the caret, or changes the one there.
            Click a chord to change or delete it.
          </p>
          <SectionEditor key={key} ref={editorRef} section={page.section} />
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
          <p className="hint">The section as it is stored.</p>
          {page.section ? (
            <pre data-testid="section">
              {JSON.stringify(page.section, null, 2)}
            </pre>
          ) : (
            <p data-testid="section">
              Nothing is left, so the section is removed.
            </p>
          )}
          <button type="button" onClick={edit}>
            Edit
          </button>
        </>
      )}
    </main>
  );
}
