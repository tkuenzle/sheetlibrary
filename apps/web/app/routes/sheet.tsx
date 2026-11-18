import "./sheet.css";

import {
  type Key,
  type Sheet,
  stepKey,
  transposeSheet,
  versionKey,
} from "chordsheet";
import { useEffect, useMemo, useRef, useState } from "react";
import { data, Link, redirect, useRevalidator } from "react-router";

import { ChooseCollectionsDialog } from "../collections/choose-collections-dialog";
import { sheetCollections } from "../collections/collections.server";
import { cloudflareContext, sessionContext } from "../context";
import { CapoButton } from "../editor/capo-button";
import { KeyButton, keyName } from "../editor/key-button";
import {
  keyQuery,
  loadSheetKey,
  useAddressParam,
  useSheetKey,
  withAddressParam,
} from "../editor/sheet-title";
import { useSheetTitleName } from "../shell/page-moves";
import { focusSheetMenu, SheetBar, SheetFrameBar } from "../shell/sheet-bar";
import { ViewButton } from "../shell/view-button";
import { SheetView } from "../sheet-view/sheet-view";
import { deleteStoredSheet } from "../sheets/delete";
import { NotFound } from "../sheets/not-found";
import { sheetMenuItems } from "../sheets/sheet-menu";
import {
  afterDelete,
  backFromPlay,
  useSheetMoves,
} from "../sheets/sheet-moves";
import { readSheetWithVersions, recordOpening } from "../sheets/sheets.server";
import { keepTextStep, readTextStep, textSize } from "../sheets/text-size";
import {
  changeVersion,
  deleteVersion,
  readVersionKey,
  saveVersion,
  type SheetVersion,
  VERSION_NAME_MAX,
} from "../sheets/versions";
import { takeHandedView } from "../sheets/view-hand-off";
import { type ListedVersion, VersionsPart } from "../sheets/versions-part";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { Icon } from "../ui/icon";
import { NameDialog } from "../ui/name-dialog";
import type { Route } from "./+types/sheet";
import { RouteError } from "../shell/route-error";

// A stored sheet to play or print, at /sheets/:id. See
// openspec/specs/play-page.

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

// Only the owner gets the sheet, as in the editor, with its versions.
// `?version` opens one, `?key` shows the sheet in another key, `?capo` with
// the shapes for a capo, and `?lyrics` without chords. A version that is gone
// leads to the sheet in its song key. The text size comes from this device's
// cookie. Opening the sheet here is noted for "Recent" on Sheets; a note that
// can't be written doesn't keep the sheet from opening. The collections that
// hold the sheet show under its title.
export async function loader({
  context,
  params,
  request,
  url,
}: Route.LoaderArgs) {
  const session = context.get(sessionContext);
  if (!session) return redirect("/sign-in");
  const { env } = context.get(cloudflareContext);
  const found = await readSheetWithVersions(env.DB, session.user.id, params.id);
  if (!found) {
    return data({ sheet: null, shownKey: null, capo: null }, { status: 404 });
  }
  const { sheet, versions } = found;
  const versionId = url.searchParams.get("version");
  if (versionId !== null && !versions.some((v) => v.id === versionId)) {
    const href = ["version", "key"].reduce(
      (next, name) => withAddressParam(next, name, null) ?? next,
      url.href,
    );
    const { pathname, search } = new URL(href);
    return redirect(`${pathname}${search}`);
  }
  const [, choices] = await Promise.all([
    recordOpening(env.DB, session.user.id, sheet.id).catch(() => undefined),
    sheetCollections(env.DB, session.user.id, sheet.id),
  ]);
  return {
    sheet,
    versions,
    collections: (choices ?? [])
      .filter((choice) => choice.holds)
      .map(({ id, name }) => ({ id, name })),
    versionId,
    shownKey: url.searchParams.get("key"),
    capo: url.searchParams.get("capo"),
    lyricsOnly: url.searchParams.has("lyrics"),
    textStep: readTextStep(request.headers.get("Cookie")),
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

export default function PlayPage({ loaderData }: Route.ComponentProps) {
  const { sheet, shownKey, capo } = loaderData;
  return sheet ? (
    <PlayView
      sheet={sheet}
      versions={loaderData.versions}
      collections={loaderData.collections}
      versionId={loaderData.versionId}
      shownKey={shownKey}
      capo={capo}
      lyricsOnly={loaderData.lyricsOnly}
      textStep={loaderData.textStep}
    />
  ) : (
    <NotFound />
  );
}

// The versions as the list shows them, each with the key it shows the sheet
// in for the song key.
function listed(versions: SheetVersion[], song: Key | null): ListedVersion[] {
  return versions.flatMap((version) => {
    const key = readVersionKey(version.key);
    return key
      ? [{ ...version, shows: song ? versionKey(key, song) : key }]
      : [];
  });
}

// A collection that holds the sheet, as it shows under the title.
export interface HoldingCollection {
  id: string;
  name: string;
}

// What a dialog over the page is doing, if one is open.
type VersionDialog =
  | { kind: "save"; key: Key }
  | { kind: "rename"; version: ListedVersion }
  | { kind: "delete"; version: ListedVersion };

export function PlayView({
  sheet,
  versions: loadedVersions = [],
  collections = [],
  versionId = null,
  shownKey = null,
  capo = null,
  lyricsOnly = false,
  textStep = 0,
}: {
  sheet: Sheet;
  // The sheet's versions, in the order they were saved.
  versions?: SheetVersion[];
  // The collections that hold the sheet, A to Z.
  collections?: HoldingCollection[];
  // The version the address opens, if any.
  versionId?: string | null;
  // The key to show the sheet in, as the address writes it, such as "F#m".
  shownKey?: string | null;
  // The capo, as the address writes it, such as "3".
  capo?: string | null;
  // Whether the address asks for the lyrics only, without chords.
  lyricsOnly?: boolean;
  // The text size this device keeps (see sheets/text-size.ts).
  textStep?: number;
}) {
  // The heading takes the title's name while it moves from the row.
  const titleName = useSheetTitleName(sheet.id, null);
  // The versions are kept here and changed from each answer of the API,
  // without loading the page again. The address follows the open one.
  const [savedVersions, setSavedVersions] = useState(loadedVersions);
  const [openId, setOpenId] = useState(versionId);
  const [dialog, setDialog] = useState<VersionDialog | null>(null);
  const [collecting, setCollecting] = useState(false);
  useAddressParam("version", openId);
  const songKey = useMemo(
    () => loadSheetKey(sheet.content).key,
    [sheet.content],
  );
  const versions = listed(savedVersions, songKey);
  const open = versions.find((version) => version.id === openId) ?? null;

  // The key and the capo only change what is shown. The page lays the sheet
  // out again for them, without asking the server, and the address follows.
  // An open version's key is home: where "Back" goes and the address counts
  // from.
  const {
    key,
    guessed,
    guess,
    shown,
    capo: fret,
    drawn,
    show,
    setCapo,
    openHome,
  } = useSheetKey(sheet.content, shownKey, capo, open?.shows ?? null);
  const current = shown ?? key;

  function openVersion(id: string | null) {
    setOpenId(id);
    openHome(versions.find((version) => version.id === id)?.shows ?? null);
  }

  // Keeps a version from the API's answer, in its place in the list.
  function keep(version: SheetVersion) {
    setSavedVersions((all) =>
      all.some((v) => v.id === version.id)
        ? all.map((v) => (v.id === version.id ? version : v))
        : [...all, version],
    );
  }
  const content =
    key && drawn ? transposeSheet(sheet.content, key, drawn) : sheet.content;
  const [step, setStep] = useState(textStep);
  // Lyrics only also changes only what is shown, and the address follows.
  // It keeps the key and the capo, for when the chords come back.
  const [lyrics, setLyrics] = useState(lyricsOnly);
  useAddressParam("lyrics", lyrics ? true : null);

  function resize(by: 1 | -1) {
    const next = step + by;
    setStep(next);
    keepTextStep(next);
  }

  // "Done" in edit mode hands back the key and the capo it showed, since
  // the play entry it steps back to still holds the ones from before. They
  // apply as a transpose does, without loading again.
  const handOffFrom = useRef({ show, setCapo });
  useEffect(() => {
    const view = takeHandedView(sheet.id);
    if (!view) return;
    handOffFrom.current.show(view.shown, { keepCapo: true });
    handOffFrom.current.setCapo(view.capo);
  }, [sheet.id]);

  const moves = useSheetMoves();
  const { revalidate } = useRevalidator();
  const [deleting, setDeleting] = useState(false);
  // Whether "Choose collections…" changed anything, so the collections
  // under the title and the rail's counts follow once it closes.
  const collectionsChanged = useRef(false);
  const editQuery = keyQuery({ shown, capo: fret });
  // The key and capo buttons, hidden with lyrics only.
  const keysShown = Boolean(key && current && !lyrics);

  return (
    <>
      <SheetBar
        mode="play"
        onBack={() => void moves.go(backFromPlay(moves.history()))}
        editTo={`/sheets/${sheet.id}/edit${editQuery ? `?${editQuery}` : ""}`}
        view={
          <ViewButton
            step={step}
            onResize={resize}
            lyrics={lyrics}
            onLyrics={setLyrics}
          />
        }
        menu={sheetMenuItems({
          onChoose: () => {
            setCollecting(true);
          },
          onDelete: () => {
            setDeleting(true);
          },
        })}
      />
      <main className="play-page">
        <div className="play-heading">
          <h1 style={{ viewTransitionName: titleName }}>{sheet.title}</h1>
          {(sheet.artist ?? open) && (
            <p className="play-artist">
              {sheet.artist}
              {/* The open version's name is in the key button; on paper,
                  where the buttons are gone, it follows the artist. */}
              {open && (
                <span className="play-print-version">
                  {sheet.artist ? ` · ${open.name}` : open.name}
                </span>
              )}
            </p>
          )}
          {(keysShown || collections.length > 0) && (
            <div className="play-chips">
              {key && current && !lyrics && (
                <>
                  <KeyButton
                    current={current}
                    song={key}
                    home={open?.shows ?? key}
                    version={open?.name}
                    songPart={(closePanel) => (
                      <VersionsPart
                        song={key}
                        guessed={guessed}
                        current={current}
                        versions={versions}
                        openId={open?.id ?? null}
                        onOpen={openVersion}
                        onSave={() => {
                          closePanel();
                          setDialog({ kind: "save", key: current });
                        }}
                        onMake={() => {
                          if (!open) return;
                          void changeVersion(sheet.id, open.id, {
                            key: keyName(current),
                          })
                            .then((version) => {
                              keep(version);
                              openHome(current);
                            })
                            // The version keeps its key; trying again works.
                            .catch(() => undefined);
                        }}
                        onRename={() => {
                          if (!open) return;
                          closePanel();
                          setDialog({ kind: "rename", version: open });
                        }}
                        onDelete={() => {
                          if (!open) return;
                          closePanel();
                          setDialog({ kind: "delete", version: open });
                        }}
                      />
                    )}
                    guessed={guessed}
                    guess={guess}
                    viewOnly
                    onPick={(to) => {
                      show(to);
                    }}
                    onStep={(step) => {
                      show(stepKey(current, step));
                    }}
                    onBack={() => {
                      show(open?.shows ?? null);
                    }}
                  />
                  <CapoButton sounding={current} capo={fret} onPick={setCapo} />
                </>
              )}
              {collections.length > 0 && (
                <ul className="play-collections" aria-label="Collections">
                  {collections.map((collection) => (
                    <li key={collection.id}>
                      <Link
                        className="play-collection"
                        to={`/collections/${collection.id}`}
                      >
                        <Icon name="stacks" size={18} />
                        {collection.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <SheetView
          sheet={content}
          fontSize={textSize(step)}
          lyricsOnly={lyrics}
        />
      </main>
      <ChooseCollectionsDialog
        open={collecting}
        sheet={sheet}
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
        title={`Delete “${sheet.title}”?`}
        text="The sheet is gone for good. This can’t be undone."
        confirm="Delete"
        failure="The sheet couldn’t be deleted. Try again."
        onConfirm={async () => {
          await deleteStoredSheet(sheet.id);
          await moves.go(afterDelete("play", moves.history()));
          // The lists and the rail's counts no longer hold the sheet.
          await revalidate();
        }}
        onClose={() => {
          setDeleting(false);
          focusSheetMenu();
        }}
      />
      <NameDialog
        open={dialog?.kind === "save" || dialog?.kind === "rename"}
        title={
          dialog?.kind === "rename" ? "Rename version" : "Save as a version"
        }
        text={
          dialog?.kind === "save"
            ? `Opens “${sheet.title}” in ${keyName(dialog.key)}. Name it for who or what it’s for.`
            : "Name it for who or what it’s for."
        }
        initial={
          dialog?.kind === "rename"
            ? dialog.version.name
            : dialog?.kind === "save"
              ? `Key ${keyName(dialog.key)}`
              : ""
        }
        maxLength={VERSION_NAME_MAX}
        failure="The version couldn’t be saved. Try again."
        onSave={async (name) => {
          if (dialog?.kind === "save") {
            const version = await saveVersion(sheet.id, {
              name,
              key: keyName(dialog.key),
            });
            keep(version);
            setOpenId(version.id);
            openHome(dialog.key);
          } else if (dialog?.kind === "rename") {
            keep(await changeVersion(sheet.id, dialog.version.id, { name }));
          }
          setDialog(null);
        }}
        onClose={() => {
          setDialog(null);
        }}
      />
      <ConfirmDialog
        open={dialog?.kind === "delete"}
        title={
          dialog?.kind === "delete"
            ? `Delete “${dialog.version.name}”?`
            : "Delete version?"
        }
        text="The sheet stays as it is. This can’t be undone."
        confirm="Delete"
        failure="The version couldn’t be deleted. Try again."
        onConfirm={async () => {
          if (dialog?.kind !== "delete") return;
          const { id } = dialog.version;
          await deleteVersion(sheet.id, id);
          setSavedVersions((all) => all.filter((v) => v.id !== id));
          // The sheet stays in the key it is shown in, without a version.
          setOpenId(null);
          openHome(null, { keepShown: true });
          setDialog(null);
        }}
        onClose={() => {
          setDialog(null);
        }}
      />
    </>
  );
}
