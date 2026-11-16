import "./sheets.css";
import "./collection.css";

import { useMemo, useRef, useState } from "react";
import {
  data,
  redirect,
  type ShouldRevalidateFunctionArgs,
  useNavigate,
  useRevalidator,
} from "react-router";

import { AddSheetsDialog } from "../collections/add-sheets-dialog";
import { COLLECTION_NAME_MAX, sheetCount } from "../collections/collections";
import {
  deleteCollection,
  renameCollection,
} from "../collections/collections-client";
import {
  addSheets,
  type Collection,
  readCollection,
  removeSheet,
} from "../collections/collections.server";
import {
  collectionFailure,
  collectionNameText,
} from "../collections/new-collection";
import { cloudflareContext, sessionContext } from "../context";
import { NotFound } from "../sheets/not-found";
import { readSheetOrder, type SheetOrder } from "../sheets/order";
import { keepListOnFailure, rowAnswer } from "../sheets/row-changes";
import { SheetList } from "../sheets/sheet-list";
import { deleteSheet } from "../sheets/sheets.server";
import { Button } from "../ui/button";
import { FloatingButton } from "../ui/floating-button";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { Menu } from "../ui/menu";
import { NameDialog } from "../ui/name-dialog";
import type { Route } from "./+types/collection";
import { revalidateUnlessUnchanged } from "../shell/revalidate";
import { RouteError } from "../shell/route-error";

// One collection, at /collections/:id: its sheets in the shared list, whose
// row menus add "Remove from …", "Add sheets", and the collection's menu with
// "Rename" and "Delete". It sits in the shell (routes/shell.tsx). See
// openspec/specs/collection-page and openspec/specs/sheet-list.

export function meta({ loaderData }: Route.MetaArgs) {
  // Missing when the page couldn't be loaded.
  const data = loaderData;
  return [
    {
      title: !data
        ? "Sheet Library"
        : data.collection
          ? `${data.collection.name} | Sheet Library`
          : "Collection not found | Sheet Library",
    },
    { name: "robots", content: "noindex" },
  ];
}

// The collection, and the order this device keeps for the list.
export async function loader({ context, params, request }: Route.LoaderArgs) {
  const session = context.get(sessionContext);
  if (!session) return redirect("/sign-in");
  const { env } = context.get(cloudflareContext);
  const collection = await readCollection(env.DB, session.user.id, params.id);
  return collection
    ? { collection, order: readSheetOrder(request.headers.get("Cookie")) }
    : data({ collection: null }, { status: 404 });
}

// Takes a sheet out ("remove"), adds the ticked ones ("add"), or deletes a
// sheet from its row ("delete"). A form on another site can't get here
// signed in, since the session cookie is SameSite=Lax.
export async function action({ context, params, request }: Route.ActionArgs) {
  const session = context.get(sessionContext);
  if (!session) return redirect("/sign-in");
  const { env } = context.get(cloudflareContext);
  const form = await request.formData();
  const userId = session.user.id;
  const sheetIds = form.getAll("sheetId").map(String);
  let ok: boolean;
  switch (form.get("intent")) {
    case "remove":
      return rowAnswer(
        "remove",
        await removeSheet(env.DB, userId, params.id, sheetIds[0] ?? ""),
      );
    case "delete":
      return rowAnswer(
        "delete",
        await deleteSheet(env.DB, userId, sheetIds[0] ?? ""),
      );
    case "add":
      ok =
        sheetIds.length > 0 &&
        (await addSheets(env.DB, userId, params.id, sheetIds));
      break;
    default:
      return data({ ok: false }, { status: 400 });
  }
  return ok ? { ok } : data({ ok }, { status: 404 });
}

// A change from a row that doesn't get through keeps the list on screen.
export async function clientAction({
  request,
  serverAction,
}: Route.ClientActionArgs) {
  return keepListOnFailure(request, serverAction);
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

export default function CollectionPage({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const { revalidate } = useRevalidator();
  if (!loaderData.collection) return <NotFound what="collection" />;
  return (
    <CollectionView
      collection={loaderData.collection}
      order={loaderData.order}
      onRenamed={revalidate}
      onDeleted={() => {
        // Deleted with a plain fetch, so the rail is told to drop it
        // (shell/revalidate.ts).
        void Promise.resolve(navigate("/collections")).then(revalidate);
      }}
    />
  );
}

export function CollectionView({
  collection,
  order = "title",
  onRenamed,
  onDeleted,
}: {
  collection: Collection;
  // The order this device keeps.
  order?: SheetOrder;
  onRenamed: () => Promise<void>;
  onDeleted: () => void;
}) {
  const [dialog, setDialog] = useState<"add" | "rename" | "delete">();
  const heading = useRef<HTMLHeadingElement>(null);
  const holds = useMemo(
    () => new Set(collection.sheets.map((sheet) => sheet.id)),
    [collection.sheets],
  );
  const count = collection.sheets.length;

  // The menu item or the row that opened a dialog may be gone, so the focus
  // goes back to the heading.
  function closed() {
    setDialog(undefined);
    heading.current?.focus();
  }

  function openAdd() {
    setDialog("add");
  }

  // Filled in the empty state, tonal beside the heading.
  const addButton = (variant: "filled" | "tonal") => (
    <Button icon="add" variant={variant} onClick={openAdd}>
      Add sheets
    </Button>
  );

  return (
    <div className="library library-with-sheets collection">
      <div className="collection-heading">
        <div className="collection-title">
          <h1 ref={heading} tabIndex={-1}>
            {collection.name}
          </h1>
          <p>{count === 0 ? "No sheets yet" : sheetCount(count)}</p>
        </div>
        {count > 0 && (
          <div className="library-actions library-actions-beside">
            {addButton("tonal")}
          </div>
        )}
        <Menu
          label="More for this collection"
          items={[
            {
              label: "Rename",
              icon: "edit",
              onSelect: () => {
                setDialog("rename");
              },
            },
            {
              label: "Delete",
              icon: "delete",
              onSelect: () => {
                setDialog("delete");
              },
            },
          ]}
        />
      </div>
      {count === 0 ? (
        <section className="library-empty" aria-labelledby="collection-empty">
          <h2 id="collection-empty">No sheets in this collection</h2>
          <p>Add sheets here, or from a sheet with “Choose collections…”.</p>
          <div className="library-actions">{addButton("filled")}</div>
        </section>
      ) : (
        <SheetList
          sheets={collection.sheets}
          order={order}
          collection={collection}
          onGone={() => heading.current?.focus()}
        />
      )}
      {count > 0 && (
        <FloatingButton icon="add" label="Add sheets" onClick={openAdd} />
      )}
      <AddSheetsDialog
        open={dialog === "add"}
        collection={collection}
        holds={holds}
        onClose={closed}
      />
      <NameDialog
        open={dialog === "rename"}
        title="Rename collection"
        text={collectionNameText}
        initial={collection.name}
        maxLength={COLLECTION_NAME_MAX}
        failure={collectionFailure}
        onSave={async (name) => {
          await renameCollection(collection.id, name);
          await onRenamed();
          closed();
        }}
        onClose={closed}
      />
      <ConfirmDialog
        open={dialog === "delete"}
        title={`Delete “${collection.name}”?`}
        text="Its sheets stay in the library. This can’t be undone."
        confirm="Delete"
        failure="The collection couldn’t be deleted. Try again."
        onConfirm={async () => {
          await deleteCollection(collection.id);
          onDeleted();
        }}
        onClose={closed}
      />
    </div>
  );
}
