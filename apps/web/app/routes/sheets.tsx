import "../ui/group-list.css";
import "./sheets.css";

import { useEffect, useRef, useState } from "react";
import {
  Form,
  Link,
  redirect,
  type ShouldRevalidateFunctionArgs,
  useNavigate,
} from "react-router";

import { closeOffer, offerClosed } from "../auth/passkey-offer";
import { hasPasskey } from "../auth/passkeys.server";
import { cloudflareContext, sessionContext } from "../context";
import { ImportDialog } from "../editor/import-button";
import { PhotoImportDialog } from "../photos/photo-import-dialog";
import { readSheetOrder, type SheetOrder } from "../sheets/order";
import { keepListOnFailure, rowAnswer } from "../sheets/row-changes";
import { SheetList } from "../sheets/sheet-list";
import { UNTITLED } from "../sheets/details";
import { importedSheetPath, importSheet } from "../sheets/import";
import { isSearch } from "../sheets/search";
import { SearchField, useSearchPending } from "../sheets/search-field";
import { revalidateUnlessUnchanged } from "../shell/revalidate";
import { RouteError } from "../shell/route-error";
import {
  createSheet,
  deleteSheet,
  hasSheets,
  listSheets,
  searchSheets,
  type SearchResult,
  type SheetListItem,
} from "../sheets/sheets.server";
import { Button, IconButton } from "../ui/button";
import { Icon } from "../ui/icon";
import { Menu } from "../ui/menu";
import { errorKind, isOnline } from "../ui/page-error";
import type { Route } from "./+types/sheets";

// The Sheets screen of the library: the signed-in person's sheets in the
// shared list, the search field, "Import" and "New sheet". It sits in the
// shell (routes/shell.tsx). See openspec/specs/library-page and
// openspec/specs/sheet-list.

export function meta() {
  return [
    { title: "Sheets | Sheet Library" },
    { name: "robots", content: "noindex" },
  ];
}

// The email link lands on `?passkey`. Only then is a passkey offered, if
// the account has none and this device didn't close the offer. With `q`
// long enough to search, the sheets are the results, the best match first.
// Otherwise the page sorts them in the order this device keeps.
export async function loader({ context, request, url }: Route.LoaderArgs) {
  const session = context.get(sessionContext);
  if (!session) return redirect("/sign-in");
  const { env } = context.get(cloudflareContext);
  const userId = session.user.id;
  const offerPasskey =
    url.searchParams.has("passkey") &&
    !offerClosed(request.headers.get("Cookie")) &&
    !(await hasPasskey(env.DB, userId));
  const q = url.searchParams.get("q") ?? "";
  const order = readSheetOrder(request.headers.get("Cookie"));
  if (!isSearch(q)) {
    const sheets = await listSheets(env.DB, userId);
    return { sheets, hasSheets: sheets.length > 0, q, offerPasskey, order };
  }
  const sheets = await searchSheets(env.DB, userId, q);
  return {
    sheets,
    hasSheets: sheets.length > 0 || (await hasSheets(env.DB, userId)),
    q,
    offerPasskey,
    order,
  };
}

// "New sheet", or deleting a sheet from its row (`intent` "delete"). A form
// on another site can't get here signed in, since the session cookie is
// SameSite=Lax, so it is sent to sign-in like a visitor.
export async function action({ context, request }: Route.ActionArgs) {
  const session = context.get(sessionContext);
  if (!session) return redirect("/sign-in");
  const { env } = context.get(cloudflareContext);
  const form = await request.formData();
  if (form.get("intent") === "delete") {
    const sheetId = form.get("sheetId");
    return rowAnswer(
      "delete",
      typeof sheetId === "string" &&
        (await deleteSheet(env.DB, session.user.id, sheetId)),
    );
  }
  const sheet = await createSheet(env.DB, session.user.id, {
    title: UNTITLED,
    content: { format: "chordsheet", version: 1, sections: [] },
  });
  return redirect(`/sheets/${sheet.id}/edit?new`);
}

// A delete from a row that doesn't get through keeps the list on screen.
export async function clientAction({
  request,
  serverAction,
}: Route.ClientActionArgs) {
  return keepListOnFailure(request, serverAction);
}

// In the browser, a search that can't reach the server doesn't fail the
// page: the screen keeps the results it shows, and says so. Any other error
// goes to the boundary below. Not on the first load, which the server
// renders. See openspec/specs/library-search.
export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs) {
  try {
    return await serverLoader();
  } catch (error) {
    if (errorKind(error, isOnline()) !== "unreachable") throw error;
    return { failed: true as const, error };
  }
}

// A row's change that didn't get through loads nothing again.
export function shouldRevalidate(args: ShouldRevalidateFunctionArgs) {
  return revalidateUnlessUnchanged(args);
}

// A page that can't be loaded shows a note in the shell, which stays. See
// openspec/specs/site-layout.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <RouteError error={error} />;
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

  const shown = useLastLoaded(loaderData);
  return (
    <LibraryView
      sheets={shown.sheets}
      hasSheets={shown.hasSheets}
      q={shown.q}
      offerPasskey={shown.offerPasskey}
      order={shown.order}
      searchFailed={"failed" in loaderData}
    />
  );
}

type LibraryData = Exclude<
  Route.ComponentProps["loaderData"],
  { failed: true }
>;

// The last data that loaded, kept while a search can't reach the server.
// With nothing loaded yet, as when Sheets opens offline, the screen fails
// and its boundary shows.
export function useLastLoaded(
  loaderData: Route.ComponentProps["loaderData"],
): LibraryData {
  const [last, setLast] = useState<LibraryData | null>(
    "failed" in loaderData ? null : loaderData,
  );
  if (!("failed" in loaderData) && loaderData !== last) {
    setLast(loaderData);
    return loaderData;
  }
  if (!last) {
    throw ("error" in loaderData ? loaderData.error : undefined) as Error;
  }
  return last;
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
      <Link className="button button-filled passkey-offer-add" to="/account">
        <Icon name="passkey" />
        Add passkey
      </Link>
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
        onImport={async (sheet, capo) => {
          const result = await importSheet(sheet);
          if ("error" in result) return result.error;
          void navigate(importedSheetPath(result.id, { capo }));
          return undefined;
        }}
      />
      <PhotoImportDialog
        open={dialog === "photos"}
        onClose={closed}
        onRead={async ({ content, title, artist }) => {
          const result = await importSheet(content, { title, artist });
          if ("error" in result) return false;
          void navigate(importedSheetPath(result.id, { title }));
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
  hasSheets = sheets.length > 0,
  q = "",
  offerPasskey = false,
  order = "title",
  searchFailed = false,
}: {
  // All sheets, or the results of the search in `q`.
  sheets: (SheetListItem | SearchResult)[];
  hasSheets?: boolean;
  q?: string;
  offerPasskey?: boolean;
  // The order this device keeps.
  order?: SheetOrder;
  // Whether the latest search couldn't reach the server, so the sheets are
  // the last results.
  searchFailed?: boolean;
}) {
  const [offering, setOffering] = useState(offerPasskey);
  const heading = useRef<HTMLHeadingElement>(null);
  const offer = offering && (
    <PasskeyOffer
      onClose={() => {
        closeOffer();
        setOffering(false);
      }}
    />
  );

  const searching = isSearch(q);
  const pending = useSearchPending();

  if (!hasSheets) {
    return (
      <div className="library">
        <h1>Sheets</h1>
        {offer}
        <section className="library-empty" aria-labelledby="library-empty">
          <h2 id="library-empty">No sheets yet</h2>
          <Actions className="library-actions" />
        </section>
      </div>
    );
  }

  return (
    <div className="library library-with-sheets">
      <div className="library-heading">
        <h1 ref={heading} tabIndex={-1}>
          Sheets
        </h1>
        <Actions className="library-actions library-actions-beside" />
      </div>
      {offer}
      <SearchField
        q={q}
        count={searching ? sheets.length : null}
        pending={pending}
      />
      {searchFailed && (
        <p className="library-search-failed" role="status">
          <Icon name="cloudOff" size={20} />
          Couldn’t search. Showing the last results.
        </p>
      )}
      {searching && sheets.length === 0 ? (
        <section
          className="library-empty"
          aria-labelledby="library-no-results"
          aria-busy={pending || undefined}
        >
          <h2 id="library-no-results">{`No sheets match “${q.trim()}”`}</h2>
        </section>
      ) : (
        <SheetList
          sheets={sheets}
          order={order}
          sorted={!searching}
          busy={pending}
          onGone={() => heading.current?.focus()}
        />
      )}
      <Actions
        size="large"
        className="library-actions library-actions-docked"
      />
    </div>
  );
}
