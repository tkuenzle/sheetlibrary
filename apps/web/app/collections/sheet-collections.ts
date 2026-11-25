import { useCallback, useContext, useEffect, useState } from "react";
import {
  type ShouldRevalidateFunctionArgs,
  UNSAFE_FrameworkContext,
  useFetcher,
} from "react-router";

import { NameRefused } from "../ui/name-dialog";
import type { SheetCollection } from "./collections";
import {
  createCollection,
  listSheetCollections,
  setInCollection,
} from "./collections-client";

// A sheet's collections, each with whether it holds the sheet, as the
// browser keeps them: one fetcher per sheet, which the dialog, the chips
// under the title and a row's menu share. React Router loads it again after
// every change made through a fetcher, so nothing calls `revalidate()` by
// hand. See openspec/changes/steady-loading/design.md.
//
// The fetchers go to the two API routes, whose `clientLoader` and
// `clientAction` call the API and answer `{ ok: false }` when it can't be
// reached or refuses, so a failure shows its note in the dialog rather than
// the page's error boundary. A fetcher whose route's code can't load makes
// React Router reload the page, and offline that shows nothing. So their
// code loads as soon as a page that can open the dialog shows, and no
// fetcher starts before it is there (useCollectionsRoutes).

export function sheetCollectionsPath(sheetId: string): string {
  return `/api/sheets/${sheetId}/collections`;
}

export function sheetCollectionPath(
  sheetId: string,
  collectionId: string,
): string {
  return `${sheetCollectionsPath(sheetId)}/${collectionId}`;
}

// Whether a fetcher's address is one of a sheet's collections routes, for
// the routes that don't load again after a tick.
export function isSheetCollectionsPath(path: string | undefined): boolean {
  return (
    path !== undefined && /^\/api\/sheets\/[^/]+\/collections(\/|$)/.test(path)
  );
}

// For a sheet's page and its edit mode: a change to the sheet's collections
// loads the collections' fetcher again, not the page, so the sheet isn't read
// again under the editor and no opening is recorded for Recent.
export function revalidateUnlessCollectionChange({
  formAction,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs): boolean {
  return !isSheetCollectionsPath(formAction) && defaultShouldRevalidate;
}

export type CollectionsAnswer =
  { ok: true; collections: SheetCollection[] } | { ok: false };

export type ChangeAnswer = { ok: true } | { ok: false; refused?: string };

// For the list route's `clientLoader`.
export async function loadSheetCollections(
  sheetId: string,
): Promise<CollectionsAnswer> {
  try {
    return { ok: true, collections: await listSheetCollections(sheetId) };
  } catch {
    return { ok: false };
  }
}

// For the list route's `clientAction`: "New collection" with the sheet in
// it. A name already used answers with the note the naming dialog shows.
export async function submitNewCollection(
  sheetId: string,
  request: Request,
): Promise<ChangeAnswer> {
  const name = (await request.formData()).get("name");
  try {
    await createCollection(typeof name === "string" ? name : "", sheetId);
    return { ok: true };
  } catch (error) {
    return error instanceof NameRefused
      ? { ok: false, refused: error.message }
      : { ok: false };
  }
}

// For a collection route's `clientAction`: PUT adds the sheet, DELETE takes
// it out.
export async function submitTick(
  sheetId: string,
  collectionId: string,
  request: Request,
): Promise<ChangeAnswer> {
  try {
    await setInCollection(sheetId, collectionId, request.method === "PUT");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export function sheetCollectionsKey(sheetId: string): string {
  return `collections:${sheetId}`;
}

export type SheetCollectionsState =
  | { kind: "loading" }
  | { kind: "failed" }
  | { kind: "loaded"; collections: SheetCollection[] };

// The two API routes the fetchers go to, by their ids in React Router's
// route list.
export const COLLECTIONS_ROUTES = [
  "routes/api.sheet-collections",
  "routes/api.sheet-collection",
];

let routesLoading: Promise<unknown> | undefined;

// Loads the code of the fetchers' routes, once. Importing a module's address
// again later gives the module the browser already has, so React Router's
// own import doesn't need the network. A load that fails, such as offline,
// is tried again the next time.
function loadRoutes(manifest: {
  routes: Record<
    string,
    | {
        module: string;
        clientLoaderModule: string | undefined;
        clientActionModule: string | undefined;
      }
    | undefined
  >;
}): Promise<unknown> {
  routesLoading ??= Promise.all(
    COLLECTIONS_ROUTES.flatMap((id) => {
      const route = manifest.routes[id];
      return route
        ? [route.module, route.clientLoaderModule, route.clientActionModule]
        : [];
    })
      .filter((address) => address !== undefined)
      .map((address) => import(/* @vite-ignore */ address)),
  ).catch((error: unknown) => {
    routesLoading = undefined;
    throw error;
  });
  return routesLoading;
}

// Starts loading the routes' code, and gives a function that settles once
// it is there, or fails when it can't load. Every fetcher to the routes
// waits for it.
export function useCollectionsRoutes(): () => Promise<unknown> {
  const framework = useContext(UNSAFE_FrameworkContext);
  const ready = useCallback(
    () => (framework ? loadRoutes(framework.manifest) : Promise.resolve()),
    [framework],
  );
  useEffect(() => {
    ready().catch(() => undefined);
  }, [ready]);
  return ready;
}

// The sheet's collections: what the fetcher loaded last, otherwise
// `initial`, what the page already knows. `load()` asks for them.
export function useSheetCollections(
  sheetId: string,
  initial?: SheetCollection[],
): { state: SheetCollectionsState; load: () => void } {
  const fetcher = useFetcher<CollectionsAnswer>({
    key: sheetCollectionsKey(sheetId),
  });
  const ready = useCollectionsRoutes();
  // The routes' code couldn't load, so the list couldn't either.
  const [unreachable, setUnreachable] = useState(false);
  return {
    state: collectionsState(
      fetcher.data ?? (unreachable ? { ok: false } : undefined),
      initial,
    ),
    load: () => {
      if (fetcher.state !== "idle") return;
      setUnreachable(false);
      ready().then(
        () => fetcher.load(sheetCollectionsPath(sheetId)),
        () => {
          setUnreachable(true);
        },
      );
    },
  };
}

export function collectionsState(
  answer: CollectionsAnswer | undefined,
  initial?: SheetCollection[],
): SheetCollectionsState {
  if (answer?.ok) return { kind: "loaded", collections: answer.collections };
  if (initial) return { kind: "loaded", collections: initial };
  if (answer) return { kind: "failed" };
  return { kind: "loading" };
}
