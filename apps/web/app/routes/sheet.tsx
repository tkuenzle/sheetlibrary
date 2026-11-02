import "./editor.css";
import "./sheet.css";

import type { Sheet } from "chordsheet";
import { useEffect, useRef, useState } from "react";
import { data, redirect } from "react-router";

import { cloudflareContext, sessionContext } from "../context";
import { EditorHelp } from "../editor/help";
import { SheetEditor, type SheetEditorHandle } from "../editor/sheet-editor";
import { SheetTitle, useSheetKey } from "../editor/sheet-title";
import { SidePanel, SidePanelButton } from "../shell/side-panel";
import { TopBar } from "../shell/top-bar";
import { type SaveState, useAutosave } from "../sheets/autosave";
import { ArtistInPlace, TitleInPlace } from "../sheets/sheet-details";
import { readSheet } from "../sheets/sheets.server";
import { Menu } from "../ui/menu";
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
// for an id that doesn't exist, with a 404 status. "New sheet" adds `?new`,
// which opens the title field.
export async function loader({ context, params, url }: Route.LoaderArgs) {
  const session = context.get(sessionContext);
  if (!session) return redirect("/sign-in");
  const { env } = context.get(cloudflareContext);
  const sheet = await readSheet(env.DB, session.user.id, params.id);
  if (!sheet) return data({ sheet: null, isNew: false }, { status: 404 });
  return { sheet, isNew: url.searchParams.has("new") };
}

export default function SheetPage({ loaderData }: Route.ComponentProps) {
  const { sheet, isNew } = loaderData;
  return sheet ? <SheetView sheet={sheet} isNew={isNew} /> : <NotFound />;
}

// Which of the sheet's details has its field open.
type Editing = "title" | "artist" | null;

export function SheetView({
  sheet,
  isNew = false,
}: {
  sheet: Sheet;
  // Opened from "New sheet": the title field starts open.
  isNew?: boolean;
}) {
  const editor = useRef<SheetEditorHandle>(null);
  const sheetKey = useSheetKey(sheet.content);
  const [title, setTitle] = useState(sheet.title);
  const [artist, setArtist] = useState(sheet.artist);
  const [editing, setEditing] = useState<Editing>(isNew ? "title" : null);
  const autosave = useAutosave(sheet, () => {
    const handed = editor.current?.handBack();
    return handed?.ok ? { title, artist, content: handed.sheet } : null;
  });
  const conflict = autosave.state === "conflict";

  // A field that is open when the sheet turns read-only closes without
  // keeping: its save could never go through.
  const conflictRef = useRef(conflict);
  useEffect(() => {
    conflictRef.current = conflict;
    if (conflict) setEditing(null);
  }, [conflict]);

  // `?new` opens the field once. Without it in the URL, a reload doesn't.
  useEffect(() => {
    if (!isNew) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("new");
    window.history.replaceState(window.history.state, "", url);
  }, [isNew]);

  // The tab follows a rename. The meta tags come from the loaded sheet.
  useEffect(() => {
    document.title = `${title} | Sheet Library`;
  }, [title]);

  function closeTitle(kept: string | null) {
    setEditing(null);
    if (kept === null || conflictRef.current || kept === title) return;
    setTitle(kept);
    autosave.edited();
  }

  function closeArtist(kept: string | undefined | null) {
    setEditing(null);
    if (kept === null || conflictRef.current || kept === artist) return;
    setArtist(kept);
    autosave.edited();
  }

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
          <EditorHelp rename />
        </SidePanelButton>
      </TopBar>
      <div className="editor-layout">
        <main className="editor-page">
          <div className="editor-intro">
            <div className="sheet-heading">
              <div className="sheet-heading-main">
                <SheetTitle
                  title={
                    <TitleInPlace
                      title={title}
                      editing={editing === "title"}
                      readOnly={conflict}
                      onOpen={() => {
                        setEditing("title");
                      }}
                      onClose={closeTitle}
                    />
                  }
                  sheetKey={sheetKey}
                  editor={editor}
                  readOnly={conflict}
                >
                  <SaveStatus state={autosave.state} />
                </SheetTitle>
                <ArtistInPlace
                  artist={artist}
                  editing={editing === "artist"}
                  readOnly={conflict}
                  onOpen={() => {
                    setEditing("artist");
                  }}
                  onClose={closeArtist}
                />
              </div>
              <Menu
                label="More for this sheet"
                items={[
                  {
                    label: "Rename",
                    icon: "edit",
                    disabled: conflict,
                    onSelect: () => {
                      setEditing("title");
                    },
                  },
                ]}
              />
            </div>
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
          <EditorHelp rename />
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
