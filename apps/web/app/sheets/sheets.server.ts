import { newSheetId, type Sheet, type SheetContent } from "chordsheet";

import { keptVersionName, readVersionKey, type SheetVersion } from "./versions";

// Each person's sheets in D1. Every function takes the owner's user id, and
// a sheet that belongs to someone else is treated as missing. See
// openspec/specs/sheet-storage.

// What a new sheet starts with. Storage gives it its id and revision.
export type NewSheet = Pick<Sheet, "title" | "artist" | "content">;

// The answer to a save.
export type SaveResult =
  | { kind: "saved"; revision: number }
  // The save was based on an older revision than the stored one.
  | { kind: "stale" }
  | { kind: "not-found" };

interface SheetRow {
  id: string;
  revision: number;
  title: string;
  artist: string | null;
  content: string;
}

function fromRow(row: SheetRow): Sheet {
  return {
    id: row.id,
    revision: row.revision,
    title: row.title,
    ...(row.artist === null ? {} : { artist: row.artist }),
    content: JSON.parse(row.content) as SheetContent,
  };
}

// A new sheet's revision.
export const FIRST_REVISION = 1;

export async function createSheet(
  db: D1Database,
  userId: string,
  sheet: NewSheet,
): Promise<Sheet> {
  const created: Sheet = {
    id: newSheetId(),
    revision: FIRST_REVISION,
    title: sheet.title,
    ...(sheet.artist === undefined ? {} : { artist: sheet.artist }),
    content: sheet.content,
  };
  const now = Date.now();
  await db
    .prepare(
      'INSERT INTO "sheet" ("id", "userId", "revision", "title", "artist", "content", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    )
    .bind(
      created.id,
      userId,
      created.revision,
      created.title,
      created.artist ?? null,
      JSON.stringify(created.content),
      now,
      now,
    )
    .run();
  return created;
}

export async function readSheet(
  db: D1Database,
  userId: string,
  id: string,
): Promise<Sheet | null> {
  const row = await db
    .prepare(
      'SELECT "id", "revision", "title", "artist", "content" FROM "sheet" WHERE "id" = ? AND "userId" = ?',
    )
    .bind(id, userId)
    .first<SheetRow>();
  return row ? fromRow(row) : null;
}

// Replaces the stored sheet with `sheet` if `sheet.revision` is the stored
// revision, and raises the revision by one. One conditional update, so two
// saves on the same revision can't both win.
export async function saveSheet(
  db: D1Database,
  userId: string,
  sheet: Sheet,
): Promise<SaveResult> {
  const result = await db
    .prepare(
      'UPDATE "sheet" SET "revision" = "revision" + 1, "title" = ?, "artist" = ?, "content" = ?, "updatedAt" = ? WHERE "id" = ? AND "userId" = ? AND "revision" = ?',
    )
    .bind(
      sheet.title,
      sheet.artist ?? null,
      JSON.stringify(sheet.content),
      Date.now(),
      sheet.id,
      userId,
      sheet.revision,
    )
    .run();
  if (result.meta.changes > 0) {
    return { kind: "saved", revision: sheet.revision + 1 };
  }
  // Nothing changed: tell a stale save from a missing sheet. Both refuse, so
  // a save landing in between can't make this answer store anything wrong.
  const stored = await db
    .prepare('SELECT 1 FROM "sheet" WHERE "id" = ? AND "userId" = ?')
    .bind(sheet.id, userId)
    .first();
  return stored ? { kind: "stale" } : { kind: "not-found" };
}

// A sheet as the library lists it, without its content.
export interface SheetListItem {
  id: string;
  title: string;
  artist?: string;
  // Milliseconds since 1970.
  updatedAt: number;
}

// The person's sheets, the most recently edited first.
export async function listSheets(
  db: D1Database,
  userId: string,
): Promise<SheetListItem[]> {
  const { results } = await db
    .prepare(
      'SELECT "id", "title", "artist", "updatedAt" FROM "sheet" WHERE "userId" = ? ORDER BY "updatedAt" DESC',
    )
    .bind(userId)
    .all<{
      id: string;
      title: string;
      artist: string | null;
      updatedAt: number;
    }>();
  return results.map((row) => ({
    id: row.id,
    title: row.title,
    ...(row.artist === null ? {} : { artist: row.artist }),
    updatedAt: row.updatedAt,
  }));
}

// Returns whether a sheet was deleted. Its versions go with it.
export async function deleteSheet(
  db: D1Database,
  userId: string,
  id: string,
): Promise<boolean> {
  const result = await db
    .prepare('DELETE FROM "sheet" WHERE "id" = ? AND "userId" = ?')
    .bind(id, userId)
    .run();
  return result.meta.changes > 0;
}

// Versions belong to the sheet's owner: every query checks the sheet's
// userId, so someone else's version is missing, as their sheet is. Saving a
// version never touches the sheet's row. See openspec/specs/sheet-versions.

// The answer to saving or changing a version.
export type VersionResult =
  | { kind: "saved"; version: SheetVersion }
  // The name or the key isn't one a version can have.
  | { kind: "invalid" }
  // No such sheet or version for this person.
  | { kind: "not-found" };

const OWNED_SHEET =
  '"sheetId" IN (SELECT "id" FROM "sheet" WHERE "id" = ? AND "userId" = ?)';

// The SQL that lists a sheet's versions, in the order they were saved.
export function listVersionsStatement(
  db: D1Database,
  userId: string,
  sheetId: string,
): D1PreparedStatement {
  return db
    .prepare(
      `SELECT "id", "name", "key" FROM "sheet_version" WHERE ${OWNED_SHEET} ORDER BY "createdAt", "rowid"`,
    )
    .bind(sheetId, userId);
}

// The sheet with its versions, in one round trip, or null if the person has
// no such sheet.
export async function readSheetWithVersions(
  db: D1Database,
  userId: string,
  id: string,
): Promise<{ sheet: Sheet; versions: SheetVersion[] } | null> {
  const [sheets, versions] = await db.batch([
    db
      .prepare(
        'SELECT "id", "revision", "title", "artist", "content" FROM "sheet" WHERE "id" = ? AND "userId" = ?',
      )
      .bind(id, userId),
    listVersionsStatement(db, userId, id),
  ]);
  const row = sheets?.results[0] as SheetRow | undefined;
  if (!row) return null;
  return {
    sheet: fromRow(row),
    versions: (versions?.results ?? []) as SheetVersion[],
  };
}

// The sheet's versions, or null if the person has no such sheet.
export async function listVersions(
  db: D1Database,
  userId: string,
  sheetId: string,
): Promise<SheetVersion[] | null> {
  const [owned, versions] = await db.batch([
    db
      .prepare('SELECT 1 FROM "sheet" WHERE "id" = ? AND "userId" = ?')
      .bind(sheetId, userId),
    listVersionsStatement(db, userId, sheetId),
  ]);
  if (!owned?.results.length) return null;
  return (versions?.results ?? []) as SheetVersion[];
}

export async function createVersion(
  db: D1Database,
  userId: string,
  sheetId: string,
  input: { name: string; key: string },
): Promise<VersionResult> {
  const name = keptVersionName(input.name);
  if (name === null || !readVersionKey(input.key)) return { kind: "invalid" };
  const version: SheetVersion = { id: newSheetId(), name, key: input.key };
  const result = await db
    .prepare(
      'INSERT INTO "sheet_version" ("id", "sheetId", "name", "key", "createdAt") SELECT ?, "id", ?, ?, ? FROM "sheet" WHERE "id" = ? AND "userId" = ?',
    )
    .bind(version.id, version.name, version.key, Date.now(), sheetId, userId)
    .run();
  return result.meta.changes > 0
    ? { kind: "saved", version }
    : { kind: "not-found" };
}

// Renames a version, or gives it another key, or both.
export async function changeVersion(
  db: D1Database,
  userId: string,
  sheetId: string,
  versionId: string,
  change: { name?: string; key?: string },
): Promise<VersionResult> {
  const name =
    change.name === undefined ? undefined : keptVersionName(change.name);
  if (name === null) return { kind: "invalid" };
  if (change.key !== undefined && !readVersionKey(change.key)) {
    return { kind: "invalid" };
  }
  const row = await db
    .prepare(
      `UPDATE "sheet_version" SET "name" = coalesce(?, "name"), "key" = coalesce(?, "key") WHERE "id" = ? AND ${OWNED_SHEET} RETURNING "id", "name", "key"`,
    )
    .bind(name ?? null, change.key ?? null, versionId, sheetId, userId)
    .first<SheetVersion>();
  return row ? { kind: "saved", version: row } : { kind: "not-found" };
}

// Returns whether a version was deleted.
export async function deleteVersion(
  db: D1Database,
  userId: string,
  sheetId: string,
  versionId: string,
): Promise<boolean> {
  const result = await db
    .prepare(`DELETE FROM "sheet_version" WHERE "id" = ? AND ${OWNED_SHEET}`)
    .bind(versionId, sheetId, userId)
    .run();
  return result.meta.changes > 0;
}
