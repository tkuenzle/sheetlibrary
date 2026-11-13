import { NameRefused } from "../ui/name-dialog";
import type { SheetCollection } from "./collections";

// The browser's calls to the collections API. Each throws when the server
// can't be reached or refuses. A name the person already uses throws a
// NameRefused, whose note the naming dialog shows.

type Fetch = typeof fetch;
const browserFetch: Fetch = (...args) => fetch(...args);

export const NAME_TAKEN = "That name is already used.";

interface SavedCollection {
  id: string;
  name: string;
}

function check(response: Response, method: string): void {
  if (response.status === 409) throw new NameRefused(NAME_TAKEN);
  if (!response.ok) {
    throw new Error(`${method} failed with ${String(response.status)}`);
  }
}

async function sendName(
  path: string,
  method: string,
  name: string,
  fetchFn: Fetch,
): Promise<SavedCollection> {
  const response = await fetchFn(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  check(response, method);
  return response.json<SavedCollection>();
}

// Makes a collection. With `sheetId`, it starts with that sheet.
export function createCollection(
  name: string,
  sheetId?: string,
  fetchFn: Fetch = browserFetch,
): Promise<SavedCollection> {
  const path =
    sheetId === undefined
      ? "/api/collections"
      : `/api/sheets/${sheetId}/collections`;
  return sendName(path, "POST", name, fetchFn);
}

export function renameCollection(
  id: string,
  name: string,
  fetchFn: Fetch = browserFetch,
): Promise<SavedCollection> {
  return sendName(`/api/collections/${id}`, "PATCH", name, fetchFn);
}

// A collection that is already gone counts as deleted.
export async function deleteCollection(
  id: string,
  fetchFn: Fetch = browserFetch,
): Promise<void> {
  const response = await fetchFn(`/api/collections/${id}`, {
    method: "DELETE",
  });
  if (!response.ok && response.status !== 404) {
    throw new Error(`Delete failed with ${String(response.status)}`);
  }
}

// The person's collections, each with whether it holds the sheet.
export async function listSheetCollections(
  sheetId: string,
  fetchFn: Fetch = browserFetch,
): Promise<SheetCollection[]> {
  const response = await fetchFn(`/api/sheets/${sheetId}/collections`);
  check(response, "GET");
  return response.json<SheetCollection[]>();
}

// Adds the sheet to the collection, or takes it out.
export async function setInCollection(
  sheetId: string,
  collectionId: string,
  holds: boolean,
  fetchFn: Fetch = browserFetch,
): Promise<void> {
  const method = holds ? "PUT" : "DELETE";
  const response = await fetchFn(
    `/api/sheets/${sheetId}/collections/${collectionId}`,
    { method },
  );
  check(response, method);
}
