import "./editor.css";
import "./sheet.css";

import type { Sheet } from "chordsheet";
import { useEffect, useRef } from "react";
import { data, redirect } from "react-router";

import { cloudflareContext, sessionContext } from "../context";
import { EditorHelp } from "../editor/help";
import { SheetEditor, type SheetEditorHandle } from "../editor/sheet-editor";
import { SheetTitle, useSheetKey } from "../editor/sheet-title";
import { SidePanel, SidePanelButton } from "../shell/side-panel";
import { TopBar } from "../shell/top-bar";
import { type SaveState, useAutosave } from "../sheets/autosave";
import { readSheet } from "../sheets/sheets.server";
import { Note } from "../ui/note";
import type { Route } from "./+types/sheet";

// A stored sheet in the editor. See openspec/specs/sheet-page.

export function meta({ loaderData }: Route.MetaArgs) {
  return [
    {
      title: loaderData.sheet
        ? `${loaderData.sheet.title} | Sheet Library`
        : "Sheet not found | Sheet Library",
    },
    { name: "robots", content: "noindex" },
  ];
}

// Only the owner gets the sheet. Anyone else gets the same "not found" as
// for an id that doesn't exist, with a 404 status.
export async function loader({ context, params }: Route.LoaderArgs) {
  const session = context.get(sessionContext);
  if (!session) return redirect("/sign-in");
  const { env } = context.get(cloudflareContext);
  const sheet = await readSheet(env.DB, session.user.id, params.id);
  if (!sheet) return data({ sheet: null }, { status: 404 });
  return { sheet };
}

export default function SheetPage({ loaderData }: Route.ComponentProps) {
  const { sheet } = loaderData;
  return sheet ? <SheetView sheet={sheet} /> : <NotFound />;
}

export function SheetView({ sheet }: { sheet: Sheet }) {
  const editor = useRef<SheetEditorHandle>(null);
  const sheetKey = useSheetKey(sheet.content);
  const autosave = useAutosave(sheet, () => {
    const handed = editor.current?.handBack();
    return handed?.ok ? handed.sheet : null;
  });
  const conflict = autosave.state === "conflict";

  // Leaving with edits that aren't saved asks first, with the browser's own
  // prompt.
  const unsaved = autosave.state !== "saved";
  useEffect(() => {
    if (!unsaved) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [unsaved]);

  return (
    <>
      <TopBar title={sheet.title}>
        <SidePanelButton icon="help" title="How to edit">
          <EditorHelp />
        </SidePanelButton>
      </TopBar>
      <div className="editor-layout">
        <main className="editor-page">
          <div className="editor-intro">
            <SheetTitle
              title={sheet.title}
              sheetKey={sheetKey}
              editor={editor}
              readOnly={conflict}
            >
              <SaveStatus state={autosave.state} />
            </SheetTitle>
            {conflict && <ConflictNote />}
          </div>
          <SheetEditor
            ref={editor}
            sheet={sheet.content}
            sheetKey={sheetKey.key}
            readOnly={conflict}
            onChange={autosave.edited}
            onChordsChange={sheetKey.onChordsChange}
          />
        </main>
        <SidePanel title="How to edit">
          <EditorHelp />
        </SidePanel>
      </div>
    </>
  );
}

const saveStateText: Record<SaveState, string> = {
  saved: "Saved",
  waiting: "Saving…",
  saving: "Saving…",
  failed: "Not saved yet. Trying again…",
  conflict: "Not saved",
};

// Whether the edits are saved, beside the title.
export function SaveStatus({ state }: { state: SaveState }) {
  return (
    <p className="save-status" role="status" data-state={state}>
      {saveStateText[state]}
    </p>
  );
}

// Saving stopped because the sheet was saved elsewhere.
export function ConflictNote() {
  return <Note>This sheet changed in another tab. Reload to see it.</Note>;
}

export function NotFound() {
  return (
    <>
      <TopBar />
      <main className="sheet-not-found">
        <h1>Sheet not found</h1>
        <p>This sheet doesn’t exist, or it belongs to another account.</p>
      </main>
    </>
  );
}
