import { useState } from "react";
import { type ShouldRevalidateFunctionArgs, useFetcher } from "react-router";

import { serverAnswer } from "../changes";
import { useRouteCode } from "../route-code";
import type { SheetCollection } from "./collections";

// A sheet's collections, each with whether it holds the sheet, as the
// browser keeps them: one fetcher per sheet, which the dialog, the chips
// under the title and a row's menu share. React Router loads it again after
// every change made through a fetcher, so nothing calls `revalidate()` by
// hand. See openspec/changes/steady-loading/design.md.
//
// The fetchers go to the two API routes, whose `clientLoader` and
// `clientAction` call the server and answer `{ ok: false }` when it can't be
// reached or refuses, so a failure shows its note in the dialog rather than
// the page's error boundary (app/changes.ts). Their code loads as soon as a
// page that can open the dialog shows, and no fetcher starts before it is
// there (app/route-code.ts).

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

// For the list route's `clientLoader`: the list, or `{ ok: false }` when
// the server can't be reached or refuses.
export async function loadSheetCollections(
  serverLoader: () => Promise<unknown>,
): Promise<CollectionsAnswer> {
  const answer = await serverAnswer(serverLoader);
  return answer.ok
    ? { ok: true, collections: answer.value as SheetCollection[] }
    : { ok: false };
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

// The sheet's collections: what the fetcher loaded last, otherwise
// `initial`, what the page already knows. `load()` asks for them.
export function useSheetCollections(
  sheetId: string,
  initial?: SheetCollection[],
): { state: SheetCollectionsState; load: () => void } {
  const fetcher = useFetcher<CollectionsAnswer>({
    key: sheetCollectionsKey(sheetId),
  });
  const ready = useRouteCode(COLLECTIONS_ROUTES);
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
