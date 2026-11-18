import "./editor.css";
import "./sheet.edit.css";

import type { Sheet } from "chordsheet";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  data,
  type Location,
  redirect,
  useBlocker,
  useNavigate,
  useRevalidator,
} from "react-router";

import { ChooseCollectionsDialog } from "../collections/choose-collections-dialog";
import { cloudflareContext, sessionContext } from "../context";
import { EditorHelp, FirstTimeHelp } from "../editor/help";
import { SheetEditor, type SheetEditorHandle } from "../editor/sheet-editor";
import { keyQuery, SheetTitle, useSheetKey } from "../editor/sheet-title";
import { focusSheetMenu, SheetBar, SheetFrameBar } from "../shell/sheet-bar";
import { SidePanelButton } from "../shell/side-panel";
import { useAutosave } from "../sheets/autosave";
import { deleteStoredSheet } from "../sheets/delete";
import { keepEditHelpSeen, readEditHelpSeen } from "../sheets/edit-help";
import { NotFound } from "../sheets/not-found";
import { ArtistInPlace, TitleInPlace } from "../sheets/sheet-details";
import { sheetMenuItems } from "../sheets/sheet-menu";
import {
  afterDelete,
  doneFromEdit,
  useSheetMoves,
} from "../sheets/sheet-moves";
import { readSheet } from "../sheets/sheets.server";
import {
  type ShownSaveState,
  useShownSaveState,
} from "../sheets/shown-save-state";
import { handViewBack } from "../sheets/view-hand-off";
import { IconButton } from "../ui/button";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { Note } from "../ui/note";
import type { Route } from "./+types/sheet.edit";
import { RouteError } from "../shell/route-error";

// A stored sheet in edit mode, at /sheets/:id/edit. "Edit" on the play view
// opens it, and "Done" goes back. See openspec/specs/sheet-page.

export function meta({ loaderData }: Route.MetaArgs) {
  // Missing when the page couldn't be loaded.
  const data = loaderData;
  return [
    {
      title: !data
        ? "Sheet Library"
        : data.sheet
          ? `${data.sheet.title} | Sheet Library`
          : "Sheet not found | Sheet Library",
    },
    { name: "robots", content: "noindex" },
  ];
}

// Only the owner gets the sheet. Anyone else gets the same "not found" as
// for an id that doesn't exist, with a 404 status. "New sheet" adds `?new`,
// which opens the title field. `?key` shows the sheet in another key, and
// `?capo` with the shapes for a capo. Whether "Got it" put away the
// first-time note comes from this device's cookie.
export async function loader({
  context,
  params,
  request,
  url,
}: Route.LoaderArgs) {
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
    helpSeen: readEditHelpSeen(request.headers.get("Cookie")),
  };
}

// A sheet that can't be loaded shows a note under the top bar. See
// openspec/specs/site-layout.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return (
    <>
      <SheetFrameBar />
      <main>
        <RouteError error={error} />
      </main>
    </>
  );
}

export default function SheetPage({ loaderData }: Route.ComponentProps) {
  const { sheet, isNew, shownKey, capo } = loaderData;
  return sheet ? (
    <SheetView
      sheet={sheet}
      isNew={isNew}
      shownKey={shownKey}
      capo={capo}
      helpSeen={loaderData.helpSeen}
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
  helpSeen = false,
}: {
  sheet: Sheet;
  // Opened from "New sheet": the title field starts open.
  isNew?: boolean;
  // The key to show the sheet in, as the address writes it, such as "F#m".
  shownKey?: string | null;
  // The capo, as the address writes it, such as "3".
  capo?: string | null;
  // Whether "Got it" put away the first-time note on this device.
  helpSeen?: boolean;
}) {
  const editor = useRef<SheetEditorHandle>(null);
  const sheetKey = useSheetKey(sheet.content, shownKey, capo);
  const [title, setTitle] = useState(sheet.title);
  const [artist, setArtist] = useState(sheet.artist);
  const [editing, setEditing] = useState<Editing>(isNew ? "title" : null);
  const [deleting, setDeleting] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  // Whether "Choose collections…" changed anything, so the rail's counts
  // follow once it closes.
  const collectionsChanged = useRef(false);
  const [noteShown, setNoteShown] = useState(!helpSeen);
  const moves = useSheetMoves();
  const { revalidate } = useRevalidator();
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
  // The address is replaced as `useAddressParam` does, keeping React
  // Router's state, which Back and Done read.
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

  // The play view that edit mode goes back to shows the key and the capo
  // shown here (see sheets/view-hand-off.ts). Handed over when edit mode
  // closes for this sheet's play view, by Done or the browser's back.
  const view = useRef({ shown: sheetKey.shown, capo: sheetKey.capo });
  useEffect(() => {
    view.current = { shown: sheetKey.shown, capo: sheetKey.capo };
  }, [sheetKey.shown, sheetKey.capo]);
  useEffect(() => {
    const id = sheet.id;
    const latest = view;
    return () => {
      // By now the address is the next page's.
      if (window.location.pathname === `/sheets/${id}`) {
        handViewBack(id, latest.current);
      }
    };
  }, [sheet.id]);

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

  // A reload or closing the tab with edits that aren't saved asks first,
  // with the browser's own prompt.
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

  // A move to another page inside the app, with Done, the browser's back or
  // a link, saves first. Only when that save fails does the page ask. After
  // a conflict or a delete, saving has stopped, so it leaves at once, and so
  // it does once the sheet is deleted from here.
  //
  // The blocked move is made again by the page, not with the blocker's
  // `proceed()`, which waits for React Router to undo a browser back first
  // and could lose the move when the save came back at the same moment.
  const leaving = useRef(false);
  // While a save for a blocked move runs, more moves are let go of, so a
  // second back press doesn't step back twice.
  const saving = useRef(false);
  const blockedAs = useRef<string>("PUSH");
  const blocker = useBlocker(
    ({ currentLocation, nextLocation, historyAction }) => {
      const block =
        !leaving.current &&
        unsaved &&
        !readOnly &&
        nextLocation.pathname !== currentLocation.pathname;
      if (block) blockedAs.current = historyAction;
      return block;
    },
  );
  const [asking, setAsking] = useState<Location | null>(null);
  const saveNow = useRef(autosave.saveNow);
  useEffect(() => {
    saveNow.current = autosave.saveNow;
  });
  const navigate = useNavigate();
  // Makes the blocked move again: a browser back steps back, and a link or
  // Done goes to its address the way it would have.
  const leave = useCallback(
    (to: Location) => {
      leaving.current = true;
      if (blockedAs.current === "POP") {
        void navigate(-1);
        return;
      }
      // A step back plays the move React Router remembered; a new address
      // asks for one, as the move that was held did.
      void navigate(`${to.pathname}${to.search}`, {
        replace: blockedAs.current === "REPLACE",
        state: to.state as unknown,
        viewTransition: true,
      });
    },
    [navigate],
  );
  useEffect(() => {
    if (blocker.state !== "blocked") return;
    const to = blocker.location;
    blocker.reset();
    if (saving.current) return;
    saving.current = true;
    void saveNow.current().then((result) => {
      saving.current = false;
      if (result === "failed") setAsking(to);
      else leave(to);
    });
  }, [blocker, leave]);

  function done() {
    const query = keyQuery(sheetKey);
    const play = `/sheets/${sheet.id}${query ? `?${query}` : ""}`;
    void moves.go(doneFromEdit(moves.history(), play));
  }

  return (
    <>
      <SheetBar
        mode="edit"
        onDone={done}
        status={<SaveStatus shown={shown} />}
        help={
          <SidePanelButton
            icon="help"
            title="How to edit"
            everyWidth
            open={helpOpen}
            onOpenChange={setHelpOpen}
          >
            <EditorHelp rename />
          </SidePanelButton>
        }
        menu={sheetMenuItems({
          onChoose: () => {
            setCollecting(true);
          },
          onDelete: () => {
            setDeleting(true);
          },
          deleted,
        })}
      />
      <div className="editor-layout">
        <main className="editor-page">
          <div className="editor-intro">
            {noteShown && (
              <FirstTimeHelp
                onShortcuts={() => {
                  setHelpOpen(true);
                }}
                onGotIt={() => {
                  keepEditHelpSeen();
                  setNoteShown(false);
                }}
              />
            )}
            <div className="sheet-heading">
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
                titleAction={
                  editing !== "title" && (
                    <IconButton
                      icon="edit"
                      label="Rename"
                      className="sheet-rename"
                      disabled={readOnly}
                      onClick={() => {
                        setEditing("title");
                      }}
                    />
                  )
                }
                sheetKey={sheetKey}
                editor={editor}
                readOnly={readOnly}
              />
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
            {conflict && <ConflictNote />}
            {deleted && <DeletedNote />}
          </div>
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
      </div>
      <ChooseCollectionsDialog
        open={collecting}
        sheet={{ id: sheet.id, title }}
        onChange={() => {
          collectionsChanged.current = true;
        }}
        onClose={() => {
          setCollecting(false);
          focusSheetMenu();
          if (collectionsChanged.current) void revalidate();
          collectionsChanged.current = false;
        }}
      />
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
          leaving.current = true;
          await moves.go(afterDelete("edit", moves.history()));
          // The lists and the rail's counts no longer hold the sheet.
          await revalidate();
        }}
        onClose={() => {
          setDeleting(false);
          focusSheetMenu();
        }}
      />
      <ConfirmDialog
        open={asking !== null}
        title="Leave without the edits?"
        text="The latest edits couldn’t be saved. Leaving loses them."
        confirm="Leave"
        failure=""
        onConfirm={() => {
          autosave.stop();
          if (asking) leave(asking);
          setAsking(null);
          return Promise.resolve();
        }}
        onClose={() => {
          setAsking(null);
        }}
      />
    </>
  );
}

const saveStateText: Record<NonNullable<ShownSaveState>, string> = {
  saved: "Saved",
  saving: "Saving…",
  failed: "Not saved yet. Trying again…",
  conflict: "Not saved",
  deleted: "Not saved",
};

// Whether the edits are saved, in the bar after Done. Empty while edits
// wait, so it stays quiet while someone types.
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
