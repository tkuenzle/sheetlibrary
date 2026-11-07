import "../ui/group-list.css";
import "./sheets.css";

import { useEffect, useRef, useState } from "react";
import { Form, redirect, useNavigate } from "react-router";

import { closeOffer, offerClosed } from "../auth/passkey-offer";
import { hasPasskey } from "../auth/passkeys.server";
import { cloudflareContext, sessionContext } from "../context";
import { ImportDialog } from "../editor/import-button";
import { PhotoImportDialog } from "../photos/photo-import-dialog";
import { TopBar } from "../shell/top-bar";
import { editDate, lastEdit } from "../sheets/last-edit";
import { UNTITLED } from "../sheets/details";
import { importedSheetPath, importSheet } from "../sheets/import";
import {
  createSheet,
  listSheets,
  type SheetListItem,
} from "../sheets/sheets.server";
import { Button, IconButton } from "../ui/button";
import { Icon } from "../ui/icon";
import { Menu } from "../ui/menu";
import type { Route } from "./+types/sheets";

// The library: the signed-in person's sheets, "Import" and "New sheet". See
// openspec/specs/library-page.

export function meta() {
  return [
    { title: "Library | Sheet Library" },
    { name: "robots", content: "noindex" },
  ];
}

// The email link lands on `?passkey`. Only then is a passkey offered, if
// the account has none and this device didn't close the offer.
export async function loader({ context, request, url }: Route.LoaderArgs) {
  const session = context.get(sessionContext);
  if (!session) return redirect("/sign-in");
  const { env } = context.get(cloudflareContext);
  const offerPasskey =
    url.searchParams.has("passkey") &&
    !offerClosed(request.headers.get("Cookie")) &&
    !(await hasPasskey(env.DB, session.user.id));
  return { sheets: await listSheets(env.DB, session.user.id), offerPasskey };
}

// "New sheet". A form on another site can't get here signed in, since the
// session cookie is SameSite=Lax, so it is sent to sign-in like a visitor.
export async function action({ context }: Route.ActionArgs) {
  const session = context.get(sessionContext);
  if (!session) return redirect("/sign-in");
  const { env } = context.get(cloudflareContext);
  const sheet = await createSheet(env.DB, session.user.id, {
    title: UNTITLED,
    content: { format: "chordsheet", version: 1, sections: [] },
  });
  return redirect(`/sheets/${sheet.id}?new`);
}

export default function Library({ loaderData }: Route.ComponentProps) {
  // `?passkey` offers a passkey once. Without it in the URL, a reload
  // doesn't.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("passkey")) return;
    url.searchParams.delete("passkey");
    window.history.replaceState(window.history.state, "", url);
  }, []);

  return (
    <>
      <TopBar />
      <LibraryView
        sheets={loaderData.sheets}
        offerPasskey={loaderData.offerPasskey}
      />
    </>
  );
}

// After an email sign-in. The passkey is added on the account page, so the
// library never asks the device itself.
function PasskeyOffer({ onClose }: { onClose: () => void }) {
  return (
    <section className="passkey-offer" aria-label="Passkey">
      <Icon name="passkey" />
      <p>
        Add a passkey to sign in on this device without waiting for an email.
      </p>
      <a className="button button-filled passkey-offer-add" href="/account">
        <Icon name="passkey" />
        Add passkey
      </a>
      <IconButton
        icon="close"
        label="Close"
        tooltipPlacement="left"
        onClick={onClose}
      />
    </section>
  );
}

// Posts to the action above. Works before the scripts load.
function NewSheet({ size }: { size?: "large" }) {
  return (
    <Form method="post">
      <Button type="submit" icon="add" size={size}>
        New sheet
      </Button>
    </Form>
  );
}

// "Import": a menu of the imports. Each creates a sheet and opens it, as
// "New sheet" does. A dialog stays until the sheet replaces the library.
// Docked at the bottom of a phone, the menu opens above the button. A sheet
// from photos takes the title read from them, and only opens to be named
// without one.
function LibraryImport({ size }: { size?: "large" }) {
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<"photos" | "ultimate-guitar">();
  const wrapper = useRef<HTMLDivElement>(null);

  function closed() {
    setDialog(undefined);
    wrapper.current?.querySelector<HTMLElement>("[aria-haspopup]")?.focus();
  }

  return (
    <div className="library-import" ref={wrapper}>
      <Menu
        label="Import"
        icon="contentPasteGo"
        text
        size={size}
        placement={size === "large" ? "above-end" : "below-start"}
        items={[
          {
            label: "From photos…",
            icon: "photoCamera",
            onSelect: () => {
              setDialog("photos");
            },
          },
          {
            label: "From Ultimate Guitar…",
            icon: "contentPasteGo",
            onSelect: () => {
              setDialog("ultimate-guitar");
            },
          },
        ]}
      />
      <ImportDialog
        open={dialog === "ultimate-guitar"}
        onClose={closed}
        onImport={async (sheet) => {
          const result = await importSheet(sheet);
          if ("error" in result) return result.error;
          void navigate(importedSheetPath(result.id));
          return undefined;
        }}
      />
      <PhotoImportDialog
        open={dialog === "photos"}
        onClose={closed}
        onRead={async ({ content, title, artist }) => {
          const result = await importSheet(content, { title, artist });
          if ("error" in result) return false;
          void navigate(importedSheetPath(result.id, title));
          return true;
        }}
      />
    </div>
  );
}

// "Import" before "New sheet", as on the canvas.
function Actions({ size, className }: { size?: "large"; className: string }) {
  return (
    <div className={className}>
      <LibraryImport size={size} />
      <NewSheet size={size} />
    </div>
  );
}

export function LibraryView({
  sheets,
  offerPasskey = false,
}: {
  sheets: SheetListItem[];
  offerPasskey?: boolean;
}) {
  const [offering, setOffering] = useState(offerPasskey);
  const offer = offering && (
    <PasskeyOffer
      onClose={() => {
        closeOffer();
        setOffering(false);
      }}
    />
  );

  // The viewer's time zone is only known in the browser. Until then, the
  // last edit is hidden, with the date in UTC holding its place.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  const now = Date.now();
  const edited = (at: number) =>
    hydrated ? lastEdit(at, now) : editDate(at, now, "UTC");

  if (sheets.length === 0) {
    return (
      <main className="library">
        <h1>Library</h1>
        {offer}
        <section className="library-empty" aria-labelledby="library-empty">
          <h2 id="library-empty">No sheets yet</h2>
          <Actions className="library-actions" />
        </section>
      </main>
    );
  }

  return (
    <main className="library library-with-sheets">
      <div className="library-heading">
        <h1>Library</h1>
        <Actions className="library-actions library-actions-beside" />
      </div>
      {offer}
      <div className="library-list">
        <div className="library-columns library-labels" aria-hidden="true">
          <span>Title</span>
          <span>Artist</span>
          <span>Edited</span>
        </div>
        <ul className="group-list">
          {sheets.map((sheet) => (
            <li key={sheet.id}>
              <a className="library-columns" href={`/sheets/${sheet.id}`}>
                <span className="library-title">{sheet.title}</span>
                <span className="library-details">
                  <span>{sheet.artist}</span>
                  {sheet.artist && (
                    <span className="library-separator" aria-hidden="true">
                      {" · "}
                    </span>
                  )}
                  <span
                    className="library-edited"
                    data-pending={hydrated ? undefined : ""}
                  >
                    {edited(sheet.updatedAt)}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      <Actions
        size="large"
        className="library-actions library-actions-docked"
      />
    </main>
  );
}
