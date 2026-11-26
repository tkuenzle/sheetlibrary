import "./sheets.css";
import "./collection.css";

import { useMemo, useRef, useState } from "react";
import {
  data,
  redirect,
  type ShouldRevalidateFunctionArgs,
} from "react-router";

import { AddSheetsDialog } from "../collections/add-sheets-dialog";
import {
  COLLECTION_NAME_MAX,
  type CollectionListItem,
  sheetCount,
} from "../collections/collections";
import {
  type Collection,
  readCollection,
} from "../collections/collections.server";
import {
  collectionFailure,
  collectionNameText,
} from "../collections/new-collection";
import { cloudflareContext, sessionContext } from "../context";
import { useFetcherSave } from "../fetcher-save";
import { NotFound } from "../sheets/not-found";
import {
  keptSheetOrder,
  readSheetOrder,
  type SheetOrder,
} from "../sheets/order";
import { SheetList, SheetListSkeleton } from "../sheets/sheet-list";
import { useArrives } from "../ui/arriving";
import { Button, IconButton } from "../ui/button";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { Menu } from "../ui/menu";
import { NameDialog } from "../ui/name-dialog";
import { Bar } from "../ui/skeleton";
import type { Route } from "./+types/collection";
import {
  backAsLeft,
  fromAnotherPage,
  handOver,
  PageData,
} from "../shell/awaited";
import { addressOf, KeptPages, loadsKeptAgain } from "../shell/kept";
import { useFocusCarriesOver } from "../shell/focus";
import { revalidateUnlessUnchanged } from "../shell/revalidate";
import { RouteError } from "../shell/route-error";
import { shellRouteId, useShellCollections } from "./shell";

// One collection, at /collections/:id: its sheets in the shared list, whose
// row menus add "Remove from …", "Add sheets", and the collection's menu with
// "Rename" and "Delete". It sits in the shell (routes/shell.tsx). See
// openspec/specs/collection-page and openspec/specs/sheet-list.

// The route renaming and deleting go to (routes/api.collection.ts).
const COLLECTION_ROUTES = ["routes/api.collection"];

// The most rows of bars while the sheets load: about a screenful.
const SKELETON_ROWS = 8;

export function meta({ loaderData, matches, params }: Route.MetaArgs) {
  // Missing when the page couldn't be loaded. On a move inside the app the
  // sheets are still on their way, so the name comes from the rail.
  const name =
    loaderData && "page" in loaderData
      ? shellCollection(matches, params.id)?.name
      : loaderData?.collection
        ? loaderData.collection.name
        : loaderData && "collection" in loaderData
          ? null
          : undefined;
  return [
    {
      title:
        name === undefined
          ? "Sheet Library"
          : name === null
            ? "Collection not found | Sheet Library"
            : `${name} | Sheet Library`,
    },
    { name: "robots", content: "noindex" },
  ];
}

// The collection as the rail lists it, from the shell's data.
function shellCollection(
  matches: Route.MetaArgs["matches"],
  id: string,
): CollectionListItem | undefined {
  const shell = matches.find((match) => match.id === shellRouteId);
  const collections = (
    shell?.loaderData as { collections?: CollectionListItem[] } | undefined
  )?.collections;
  return collections?.find((collection) => collection.id === id);
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

// What each collection showed last, for a step back to it.
const kept = new KeptPages<CollectionAnswer>();

// On a step back or forward, the collection shows as it was left, and loads
// again behind it (shell/kept.ts). On another move from another page, it
// waits a moment for the sheets: if they come in time it moves in whole,
// otherwise with what the rail knows and bars, and the sheets follow.
// Loading again, as after a change on a row, it waits and keeps its sheets.
// A first load doesn't run this, so the server renders the page whole. See
// openspec/specs/site-layout.
export async function clientLoader({
  context,
  serverLoader,
  url,
}: Route.ClientLoaderArgs) {
  const back = backAsLeft(kept, url, context, serverLoader);
  if (back) return back;
  if (!fromAnotherPage(url)) {
    return await kept.again(addressOf(url), serverLoader);
  }
  return await handOver(serverLoader(), context);
}

type CollectionAnswer = Awaited<
  ReturnType<Route.ClientLoaderArgs["serverLoader"]>
>;

// A row's change that didn't get through loads nothing again. In the load
// after a step back, it loads again only when it showed as it was left.
export function shouldRevalidate(args: ShouldRevalidateFunctionArgs) {
  return (
    loadsKeptAgain(kept, addressOf(args.nextUrl)) ??
    revalidateUnlessUnchanged(args)
  );
}

// A page that can't be loaded shows a note in the shell, which stays. See
// openspec/specs/site-layout.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <RouteError error={error} />;
}

// The page's data: whole after a first load, on its way after a move. It is
// keyed by the collection, so another collection shows its own skeleton,
// not the sheets of the last one.
export default function CollectionPage({
  loaderData,
  params,
}: Route.ComponentProps) {
  const listed = useShellCollections().find(
    (collection) => collection.id === params.id,
  );
  const page = "page" in loaderData ? loaderData.page : loaderData;
  return (
    <PageData
      key={params.id}
      data={page}
      skeleton={<CollectionSkeleton listed={listed} />}
      kept={kept}
    >
      {(loaded) => (
        <LoadedCollection loaded={loaded} nameWasBar={listed === undefined} />
      )}
    </PageData>
  );
}

// The collection once its data is there, or "not found".
function LoadedCollection({
  loaded,
  nameWasBar,
}: {
  loaded: { collection: Collection | null; order?: SheetOrder };
  nameWasBar: boolean;
}) {
  if (!loaded.collection) return <NotFound what="collection" />;
  return (
    <CollectionView
      collection={loaded.collection}
      order={loaded.order}
      nameWasBar={nameWasBar}
    />
  );
}

export function CollectionView({
  collection,
  order = "title",
  nameWasBar = false,
}: {
  collection: Collection;
  // The order this device keeps.
  order?: SheetOrder;
  // Whether the skeleton showed bars for the name and count, without the
  // rail's entry, so they fade in with the rows (ui/arriving.tsx).
  nameWasBar?: boolean;
}) {
  const [dialog, setDialog] = useState<"add" | "rename" | "delete">();
  // Renaming and deleting go to the collection's API route, and the page
  // and the rail load again by themselves. Deleting opens Collections.
  const rename = useFetcherSave(`rename:${collection.id}`, COLLECTION_ROUTES);
  const remove = useFetcherSave(`delete:${collection.id}`, COLLECTION_ROUTES);
  const address = `/api/collections/${collection.id}`;
  const heading = useRef<HTMLHeadingElement>(null);
  const holds = useMemo(
    () => new Set(collection.sheets.map((sheet) => sheet.id)),
    [collection.sheets],
  );
  const count = collection.sheets.length;
  const nameArrives = useArrives("", nameWasBar);
  const countArrives = useArrives("", nameWasBar);

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
          <h1 ref={heading} tabIndex={-1} {...nameArrives}>
            {collection.name}
          </h1>
          <p {...countArrives}>
            {count === 0 ? "No sheets yet" : sheetCount(count)}
          </p>
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
          await rename(
            { name },
            { method: "patch", action: address, encType: "application/json" },
          );
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
        onConfirm={() => remove(null, { method: "delete", action: address })}
        onClose={closed}
      />
    </div>
  );
}

// The page while its sheets are on their way, as on the canvas board "A
// collection, loading": the name and count from the rail, and as many rows
// of bars as it holds, up to a screenful. The buttons wait for the sheets.
// Without the rail's entry, as for a collection made elsewhere just now,
// the name and count are bars too.
export function CollectionSkeleton({
  listed,
}: {
  listed?: Pick<CollectionListItem, "name" | "count">;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useFocusCarriesOver(heading);
  const count = listed?.count;
  return (
    <div className="library library-with-sheets collection">
      <div className="collection-heading">
        <div className="collection-title">
          <h1 ref={heading} tabIndex={-1}>
            {listed ? listed.name : <Bar width={6} />}
          </h1>
          <p>
            {count === undefined ? (
              <Bar width={4} />
            ) : count === 0 ? (
              "No sheets yet"
            ) : (
              sheetCount(count)
            )}
          </p>
        </div>
        {count !== 0 && (
          <div className="library-actions library-actions-beside">
            <Button icon="add" variant="tonal" disabled>
              Add sheets
            </Button>
          </div>
        )}
        <div className="menu">
          <IconButton
            icon="moreVert"
            label="More for this collection"
            disabled
          />
        </div>
      </div>
      {count !== 0 && (
        <SheetListSkeleton
          rows={Math.min(count ?? SKELETON_ROWS, SKELETON_ROWS)}
          order={keptSheetOrder()}
        />
      )}
    </div>
  );
}
