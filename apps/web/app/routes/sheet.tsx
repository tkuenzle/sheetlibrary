import "./sheet.css";

import { type Sheet, stepKey, transposeSheet } from "chordsheet";
import { useState } from "react";
import { data, redirect } from "react-router";

import { cloudflareContext, sessionContext } from "../context";
import { CapoButton } from "../editor/capo-button";
import { KeyButton } from "../editor/key-button";
import { keyQuery, useSheetKey } from "../editor/sheet-title";
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
import { IconButton } from "../ui/button";
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
// another key, and `?capo` with the shapes for a capo. The text size comes
// from this device's cookie.
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
  textStep = 0,
}: {
  sheet: Sheet;
  // The key to show the sheet in, as the address writes it, such as "F#m".
  shownKey?: string | null;
  // The capo, as the address writes it, such as "3".
  capo?: string | null;
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

  function resize(by: 1 | -1) {
    const next = step + by;
    setStep(next);
    keepTextStep(next);
  }

  // The text size and Print: in the top bar, or on a phone in a menu after
  // the key and the capo.
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
            {key && current && (
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
            <div className="play-more">
              <Menu label="More" items={actions} />
            </div>
          </div>
          {sheet.artist && <p className="play-artist">{sheet.artist}</p>}
        </div>
        <SheetView sheet={content} fontSize={textSize(step)} />
      </main>
    </>
  );
}
