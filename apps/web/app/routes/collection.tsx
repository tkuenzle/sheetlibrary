import "../ui/group-list.css";
import "./sheets.css";
import "./collection.css";

import { useMemo, useRef, useState } from "react";
import {
  data,
  Link,
  redirect,
  useFetcher,
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
import { Button, IconButton } from "../ui/button";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { Menu } from "../ui/menu";
import { NameDialog } from "../ui/name-dialog";
import type { Route } from "./+types/collection";

// One collection, at /collections/:id: its sheets A to Z, "Add sheets", a
// button on each row to take the sheet out, and the menu with "Rename" and
// "Delete". It sits in the shell (routes/shell.tsx). See
// openspec/specs/collection-page.

export function meta({ loaderData }: Route.MetaArgs) {
  return [
    {
      title: loaderData.collection
        ? `${loaderData.collection.name} | Sheet Library`
        : "Collection not found | Sheet Library",
    },
    { name: "robots", content: "noindex" },
  ];
}

export async function loader({ context, params }: Route.LoaderArgs) {
  const session = context.get(sessionContext);
  if (!session) return redirect("/sign-in");
  const { env } = context.get(cloudflareContext);
  const collection = await readCollection(env.DB, session.user.id, params.id);
  return collection
    ? { collection }
    : data({ collection: null }, { status: 404 });
}

// Takes a sheet out ("remove") or adds the ticked ones ("add"). A form on
// another site can't get here signed in, since the session cookie is
// SameSite=Lax.
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
      ok = await removeSheet(env.DB, userId, params.id, sheetIds[0] ?? "");
      break;
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

export default function CollectionPage({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const { revalidate } = useRevalidator();
  if (!loaderData.collection) return <NotFound what="collection" />;
  return (
    <CollectionView
      collection={loaderData.collection}
      onRenamed={revalidate}
      onDeleted={() => {
        void navigate("/collections");
      }}
    />
  );
}

export function CollectionView({
  collection,
  onRenamed,
  onDeleted,
}: {
  collection: Collection;
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

  const addButton = (size?: "large") => (
    <Button
      icon="add"
      size={size}
      onClick={() => {
        setDialog("add");
      }}
    >
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
            {addButton()}
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
          <div className="library-actions">{addButton()}</div>
        </section>
      ) : (
        <div className="library-list collection-list">
          <div className="collection-columns library-labels" aria-hidden="true">
            <span>Title</span>
            <span>Artist</span>
          </div>
          <ul className="group-list">
            {collection.sheets.map((sheet) => (
              <SheetRow
                key={sheet.id}
                collection={collection}
                sheet={sheet}
                onRemoved={() => heading.current?.focus()}
              />
            ))}
          </ul>
        </div>
      )}
      {count > 0 && (
        <div className="library-actions library-actions-docked">
          {addButton("large")}
        </div>
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

// A sheet in the collection: its title and artist, opening it to play, and
// the button that takes it out. The row goes as soon as the button is
// pressed; if the server refuses, it comes back.
function SheetRow({
  collection,
  sheet,
  onRemoved,
}: {
  collection: Collection;
  sheet: Collection["sheets"][number];
  onRemoved: () => void;
}) {
  const fetcher = useFetcher<{ ok: boolean }>();
  const removing = fetcher.state !== "idle" || (fetcher.data?.ok ?? false);
  if (removing) return null;
  return (
    <li className="collection-row">
      <Link className="collection-columns" to={`/sheets/${sheet.id}`}>
        <span className="library-title">{sheet.title}</span>
        <span>{sheet.artist}</span>
      </Link>
      <fetcher.Form
        method="post"
        onSubmit={() => {
          onRemoved();
        }}
      >
        <input type="hidden" name="intent" value="remove" />
        <input type="hidden" name="sheetId" value={sheet.id} />
        <IconButton
          type="submit"
          icon="doNotDisturbOn"
          label={`Remove ${sheet.title} from ${collection.name}`}
          tooltipPlacement="left"
        />
      </fetcher.Form>
    </li>
  );
}
