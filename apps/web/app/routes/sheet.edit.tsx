import "./editor.css";
import "./sheet.edit.css";

import type { Sheet } from "chordsheet";
import { useEffect, useRef, useState } from "react";
import { data, redirect, useNavigate } from "react-router";

import { cloudflareContext, sessionContext } from "../context";
import { EditorHelp } from "../editor/help";
import { SheetEditor, type SheetEditorHandle } from "../editor/sheet-editor";
import { keyQuery, SheetTitle, useSheetKey } from "../editor/sheet-title";
import { PlayEditSwitch } from "../shell/play-edit-switch";
import { SidePanel, SidePanelButton } from "../shell/side-panel";
import { TopBar } from "../shell/top-bar";
import { type SaveState, useAutosave } from "../sheets/autosave";
import { ArtistInPlace, TitleInPlace } from "../sheets/sheet-details";
import {
  type ShownSaveState,
  useShownSaveState,
} from "../sheets/shown-save-state";
import { deleteStoredSheet } from "../sheets/delete";
import { NotFound } from "../sheets/not-found";
import { readSheet } from "../sheets/sheets.server";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { Menu, type MenuItem } from "../ui/menu";
import { Note } from "../ui/note";
import type { Route } from "./+types/sheet.edit";

// A stored sheet in the editor, at /sheets/:id/edit. See
// openspec/specs/sheet-page.

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
// which opens the title field. `?key` shows the sheet in another key, and
// `?capo` with the shapes for a capo.
export async function loader({ context, params, url }: Route.LoaderArgs) {
  const session = context.get(sessionContext);
  if (!session) return redirect("/sign-in");
  const { env } = context.get(cloudflareContext);
  const sheet = await readSheet(env.DB, session.user.id, params.id);
  if (!sheet) {
    return data(
      { sheet: null, isNew: false, shownKey: null, capo: null },
      { status: 404 },
    );
  }
  return {
    sheet,
    isNew: url.searchParams.has("new"),
    shownKey: url.searchParams.get("key"),
    capo: url.searchParams.get("capo"),
  };
}

export default function SheetPage({ loaderData }: Route.ComponentProps) {
  const { sheet, isNew, shownKey, capo } = loaderData;
  const navigate = useNavigate();
  return sheet ? (
    <SheetView
      sheet={sheet}
      isNew={isNew}
      shownKey={shownKey}
      capo={capo}
      onDeleted={() => void navigate("/sheets")}
    />
  ) : (
    <NotFound />
  );
}

// Which of the sheet's details has its field open.
type Editing = "title" | "artist" | null;

export function SheetView({
  sheet,
  isNew = false,
  shownKey = null,
  capo = null,
  onDeleted = () => undefined,
}: {
  sheet: Sheet;
  // Opened from "New sheet": the title field starts open.
  isNew?: boolean;
  // The key to show the sheet in, as the address writes it, such as "F#m".
  shownKey?: string | null;
  // The capo, as the address writes it, such as "3".
  capo?: string | null;
  // Called once the sheet is deleted, to leave the page.
  onDeleted?: () => void;
}) {
  const editor = useRef<SheetEditorHandle>(null);
  const sheetKey = useSheetKey(sheet.content, shownKey, capo);
  const [title, setTitle] = useState(sheet.title);
  const [artist, setArtist] = useState(sheet.artist);
  const [editing, setEditing] = useState<Editing>(isNew ? "title" : null);
  const [deleting, setDeleting] = useState(false);
  const heading = useRef<HTMLDivElement>(null);
  const autosave = useAutosave(sheet, () => {
    const handed = editor.current?.handBack();
    return handed?.ok ? { title, artist, content: handed.sheet } : null;
  });
  const shown = useShownSaveState(autosave.state);
  const conflict = autosave.state === "conflict";
  const deleted = autosave.state === "deleted";
  // Saving has stopped for good, so nothing more can be edited.
  const readOnly = conflict || deleted;

  // A field that is open when the sheet turns read-only closes without
  // keeping: its save could never go through.
  const readOnlyRef = useRef(readOnly);
  useEffect(() => {
    readOnlyRef.current = readOnly;
    if (readOnly) setEditing(null);
  }, [readOnly]);

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
    if (kept === null || readOnlyRef.current || kept === title) return;
    setTitle(kept);
    autosave.edited();
  }

  function closeArtist(kept: string | undefined | null) {
    setEditing(null);
    if (kept === null || readOnlyRef.current || kept === artist) return;
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
      <TopBar
        back
        afterBack={
          <PlayEditSwitch
            id={sheet.id}
            current="edit"
            query={keyQuery(sheetKey)}
          />
        }
      >
        <SidePanelButton icon="help" title="How to edit">
          <EditorHelp rename />
        </SidePanelButton>
      </TopBar>
      <div className="editor-layout">
        <main className="editor-page">
          <div className="editor-intro">
            <div className="sheet-heading" ref={heading}>
              <div className="sheet-heading-main">
                <SheetTitle
                  title={
                    <TitleInPlace
                      title={title}
                      editing={editing === "title"}
                      readOnly={readOnly}
                      onOpen={() => {
                        setEditing("title");
                      }}
                      onClose={closeTitle}
                    />
                  }
                  sheetKey={sheetKey}
                  editor={editor}
                  readOnly={readOnly}
                >
                  <SaveStatus shown={shown} />
                </SheetTitle>
                <ArtistInPlace
                  artist={artist}
                  editing={editing === "artist"}
                  readOnly={readOnly}
                  onOpen={() => {
                    setEditing("artist");
                  }}
                  onClose={closeArtist}
                />
              </div>
              <Menu
                label="More for this sheet"
                items={sheetMenuItems({
                  state: autosave.state,
                  onRename: () => {
                    setEditing("title");
                  },
                  onDelete: () => {
                    setDeleting(true);
                  },
                })}
              />
            </div>
            {conflict && <ConflictNote />}
            {deleted && <DeletedNote />}
          </div>
          <ConfirmDialog
            open={deleting}
            title={`Delete “${title}”?`}
            text="The sheet is gone for good. This can’t be undone."
            confirm="Delete"
            failure="The sheet couldn’t be deleted. Try again."
            onConfirm={async () => {
              await deleteStoredSheet(sheet.id);
              // Edits not saved yet go with the sheet.
              autosave.stop();
              onDeleted();
            }}
            onClose={() => {
              setDeleting(false);
              // The menu item that opened the dialog is gone, so the focus
              // goes back to the menu's button.
              heading.current
                ?.querySelector<HTMLElement>("[aria-haspopup=menu]")
                ?.focus();
            }}
          />
          <SheetEditor
            ref={editor}
            sheet={sheet.content}
            sheetKey={sheetKey.key}
            shownKey={sheetKey.drawn}
            readOnly={readOnly}
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

// The sheet's menu. Rename needs saving to work; Delete doesn't, so it stays
// after a conflict, but not once the sheet is gone.
export function sheetMenuItems({
  state,
  onRename,
  onDelete,
}: {
  state: SaveState;
  onRename: () => void;
  onDelete: () => void;
}): MenuItem[] {
  return [
    {
      label: "Rename",
      icon: "edit",
      disabled: state === "conflict" || state === "deleted",
      onSelect: onRename,
    },
    {
      label: "Delete",
      icon: "delete",
      disabled: state === "deleted",
      onSelect: onDelete,
    },
  ];
}

const saveStateText: Record<NonNullable<ShownSaveState>, string> = {
  saved: "Saved",
  saving: "Saving…",
  failed: "Not saved yet. Trying again…",
  conflict: "Not saved",
  deleted: "Not saved",
};

// Whether the edits are saved, beside the title. Empty while edits wait, so
// it stays quiet while someone types.
export function SaveStatus({ shown }: { shown: ShownSaveState }) {
  return (
    <p className="save-status" role="status" data-state={shown ?? undefined}>
      {shown && saveStateText[shown]}
    </p>
  );
}

// Saving stopped because the sheet was saved elsewhere.
export function ConflictNote() {
  return <Note>This sheet changed in another tab. Reload to see it.</Note>;
}

// Saving stopped because the sheet was deleted elsewhere. The edits stay on
// screen, so they can be copied before leaving.
export function DeletedNote() {
  return (
    <Note>
      This sheet was deleted. <a href="/sheets">Back to library</a>
    </Note>
  );
}
