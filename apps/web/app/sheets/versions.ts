import type { Key } from "chordsheet";

// A sheet's versions: a name and a key, for who or what it is played for.
// The rules here hold in the browser and on the server. See
// openspec/specs/sheet-versions.

export interface SheetVersion {
  id: string;
  name: string;
  // The key as written, such as "A" or "F#m".
  key: string;
}

// The longest name a version can have, in UTF-16 code units.
export const VERSION_NAME_MAX = 40;

// The name to keep from the field's text, or null if it can't be one.
export function keptVersionName(text: string): string | null {
  const name = text.trim();
  return name.length > 0 && name.length <= VERSION_NAME_MAX ? name : null;
}

// Reads a key as written, "A", "Bb" or "F#m". Anything else is null.
export function readVersionKey(text: string): Key | null {
  const match = /^([A-G][#b]?)(m?)$/.exec(text);
  return match ? { tonic: match[1] ?? "", minor: match[2] === "m" } : null;
}

type Fetch = typeof fetch;
const browserFetch: Fetch = (...args) => fetch(...args);

async function send(
  path: string,
  method: string,
  body: unknown,
  fetchFn: Fetch,
): Promise<SheetVersion> {
  const response = await fetchFn(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`${method} failed with ${String(response.status)}`);
  }
  return response.json<SheetVersion>();
}

// The browser's calls to the versions API. Each throws when the server can't
// be reached or refuses.

export function saveVersion(
  sheetId: string,
  version: { name: string; key: string },
  fetchFn: Fetch = browserFetch,
): Promise<SheetVersion> {
  return send(`/api/sheets/${sheetId}/versions`, "POST", version, fetchFn);
}

// Renames a version, or gives it another key.
export function changeVersion(
  sheetId: string,
  versionId: string,
  change: { name: string } | { key: string },
  fetchFn: Fetch = browserFetch,
): Promise<SheetVersion> {
  return send(
    `/api/sheets/${sheetId}/versions/${versionId}`,
    "PATCH",
    change,
    fetchFn,
  );
}

// A version that is already gone counts as deleted.
export async function deleteVersion(
  sheetId: string,
  versionId: string,
  fetchFn: Fetch = browserFetch,
): Promise<void> {
  const response = await fetchFn(
    `/api/sheets/${sheetId}/versions/${versionId}`,
    { method: "DELETE" },
  );
  if (!response.ok && response.status !== 404) {
    throw new Error(`Delete failed with ${String(response.status)}`);
  }
}
