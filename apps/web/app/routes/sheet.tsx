import "./sheet.css";

import { type Sheet, stepKey, transposeSheet } from "chordsheet";
import { useState } from "react";
import { data, redirect } from "react-router";

import { cloudflareContext, sessionContext } from "../context";
import { CapoButton } from "../editor/capo-button";
import { KeyButton } from "../editor/key-button";
import { keyQuery, useAddressParam, useSheetKey } from "../editor/sheet-title";
import { PlayEditSwitch } from "../shell/play-edit-switch";
import { TopBar } from "../shell/top-bar";
import { SheetView } from "../sheet-view/sheet-view";
import { NotFound } from "../sheets/not-found";
import { readSheet } from "../sheets/sheets.server";
import {
  keepTextStep,
  MAX_TEXT_STEP,
  MIN_TEXT_STEP,
  readTextStep,
  textSize,
} from "../sheets/text-size";
import { Button, IconButton } from "../ui/button";
import { Menu, type MenuItem } from "../ui/menu";
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

// Only the owner gets the sheet, as in the editor. `?key` shows the sheet in
// another key, `?capo` with the shapes for a capo, and `?lyrics` without
// chords. The text size comes from this device's cookie.
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
    return data({ sheet: null, shownKey: null, capo: null }, { status: 404 });
  }
  return {
    sheet,
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
      shownKey={shownKey}
      capo={capo}
      lyricsOnly={loaderData.lyricsOnly}
      textStep={loaderData.textStep}
    />
  ) : (
    <NotFound />
  );
}

export function PlayView({
  sheet,
  shownKey = null,
  capo = null,
  lyricsOnly = false,
  textStep = 0,
}: {
  sheet: Sheet;
  // The key to show the sheet in, as the address writes it, such as "F#m".
  shownKey?: string | null;
  // The capo, as the address writes it, such as "3".
  capo?: string | null;
  // Whether the address asks for the lyrics only, without chords.
  lyricsOnly?: boolean;
  // The text size this device keeps (see sheets/text-size.ts).
  textStep?: number;
}) {
  // The key and the capo only change what is shown. The page lays the sheet
  // out again for them, without asking the server, and the address follows.
  const {
    key,
    guessed,
    guess,
    shown,
    capo: fret,
    drawn,
    show,
    setCapo,
  } = useSheetKey(sheet.content, shownKey, capo);
  const current = shown ?? key;
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
                    show(null);
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
          {sheet.artist && <p className="play-artist">{sheet.artist}</p>}
        </div>
        <SheetView
          sheet={content}
          fontSize={textSize(step)}
          lyricsOnly={lyrics}
        />
      </main>
    </>
  );
}
