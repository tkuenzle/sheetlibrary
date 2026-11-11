import "./sheet.css";

import {
  type Key,
  type Sheet,
  stepKey,
  transposeSheet,
  versionKey,
} from "chordsheet";
import { useMemo, useState } from "react";
import { data, redirect } from "react-router";

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
import { PlayEditSwitch } from "../shell/play-edit-switch";
import { TopBar } from "../shell/top-bar";
import { SheetView } from "../sheet-view/sheet-view";
import { NotFound } from "../sheets/not-found";
import { readSheetWithVersions } from "../sheets/sheets.server";
import {
  keepTextStep,
  MAX_TEXT_STEP,
  MIN_TEXT_STEP,
  readTextStep,
  textSize,
} from "../sheets/text-size";
import {
  changeVersion,
  deleteVersion,
  readVersionKey,
  saveVersion,
  type SheetVersion,
  VERSION_NAME_MAX,
} from "../sheets/versions";
import { type ListedVersion, VersionsPart } from "../sheets/versions-part";
import { Button, IconButton } from "../ui/button";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { Menu, type MenuItem } from "../ui/menu";
import { NameDialog } from "../ui/name-dialog";
import type { Route } from "./+types/sheet";

// A stored sheet to play or print, at /sheets/:id. See
// openspec/specs/play-page.

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

// Only the owner gets the sheet, as in the editor, with its versions.
// `?version` opens one, `?key` shows the sheet in another key, `?capo` with
// the shapes for a capo, and `?lyrics` without chords. A version that is gone
// leads to the sheet in its song key. The text size comes from this device's
// cookie.
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
  return {
    sheet,
    versions,
    versionId,
    shownKey: url.searchParams.get("key"),
    capo: url.searchParams.get("capo"),
    lyricsOnly: url.searchParams.has("lyrics"),
    textStep: readTextStep(request.headers.get("Cookie")),
  };
}

export default function PlayPage({ loaderData }: Route.ComponentProps) {
  const { sheet, shownKey, capo } = loaderData;
  return sheet ? (
    <PlayView
      sheet={sheet}
      versions={loaderData.versions}
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

// What a dialog over the page is doing, if one is open.
type VersionDialog =
  | { kind: "save"; key: Key }
  | { kind: "rename"; version: ListedVersion }
  | { kind: "delete"; version: ListedVersion };

export function PlayView({
  sheet,
  versions: loadedVersions = [],
  versionId = null,
  shownKey = null,
  capo = null,
  lyricsOnly = false,
  textStep = 0,
}: {
  sheet: Sheet;
  // The sheet's versions, in the order they were saved.
  versions?: SheetVersion[];
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
  // The versions are kept here and changed from each answer of the API,
  // without loading the page again. The address follows the open one.
  const [savedVersions, setSavedVersions] = useState(loadedVersions);
  const [openId, setOpenId] = useState(versionId);
  const [dialog, setDialog] = useState<VersionDialog | null>(null);
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

  // Lyrics only, the text size and Print: in the top bar, or on a phone in a
  // menu after the key and the capo.
  const lyricsItem: MenuItem = {
    label: "Lyrics only",
    icon: "lyrics",
    checked: lyrics,
    separated: true,
    onSelect: () => {
      setLyrics(!lyrics);
    },
  };
  const actions: MenuItem[] = [
    {
      label: "Smaller text",
      icon: "textDecrease",
      disabled: step <= MIN_TEXT_STEP,
      onSelect: () => {
        resize(-1);
      },
    },
    {
      label: "Larger text",
      icon: "textIncrease",
      disabled: step >= MAX_TEXT_STEP,
      onSelect: () => {
        resize(1);
      },
    },
    {
      label: "Print",
      icon: "print",
      onSelect: () => {
        window.print();
      },
    },
  ];

  return (
    <>
      <TopBar
        back
        afterBack={
          <PlayEditSwitch
            id={sheet.id}
            current="play"
            query={keyQuery({ shown, capo: fret })}
          />
        }
      >
        <div className="play-actions">
          <Button
            variant="text"
            size="small"
            icon={lyrics ? "check" : "lyrics"}
            className="play-lyrics-toggle"
            aria-pressed={lyrics}
            onClick={lyricsItem.onSelect}
          >
            Lyrics only
          </Button>
          <span className="play-actions-divider" aria-hidden="true" />
          {actions.map((action) => (
            <IconButton
              key={action.label}
              icon={action.icon}
              label={action.label}
              disabled={action.disabled}
              onClick={action.onSelect}
            />
          ))}
        </div>
      </TopBar>
      <main className="play-page">
        <div className="play-heading">
          <div className="play-title">
            <h1>{sheet.title}</h1>
            {key && current && !lyrics && (
              <div className="play-keys">
                <KeyButton
                  current={current}
                  song={key}
                  home={open?.shows ?? key}
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
              </div>
            )}
            {/* On a phone, at the end of the row: the label stays with the
                menu, and the menu has room to open to the left. */}
            <div className="play-more">
              {lyrics && <span className="play-lyrics-label">Lyrics only</span>}
              <Menu label="More" items={[lyricsItem, ...actions]} />
            </div>
          </div>
          {(sheet.artist ?? open) && (
            <p className="play-artist">
              {[sheet.artist, open?.name].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <SheetView
          sheet={content}
          fontSize={textSize(step)}
          lyricsOnly={lyrics}
        />
      </main>
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
