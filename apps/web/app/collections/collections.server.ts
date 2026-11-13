import { newSheetId } from "chordsheet";

import {
  type CollectionListItem,
  collectionNameKey,
  keptCollectionName,
  type SheetCollection,
  sortedBy,
} from "./collections";

// Each person's collections in D1. Every function takes the owner's user id,
// and a collection or a sheet that belongs to someone else is treated as
// missing. Adding or removing sheets never touches a sheet's row. See
// openspec/specs/collections.

// A collection with its sheets, A to Z by title.
export interface Collection {
  id: string;
  name: string;
  sheets: CollectionSheet[];
}

export interface CollectionSheet {
  id: string;
  title: string;
  artist?: string;
}

// The answer to making or renaming a collection.
export type CollectionResult =
  | { kind: "saved"; collection: { id: string; name: string } }
  // The name is empty or too long.
  | { kind: "invalid" }
  // The person already has a collection by that name.
  | { kind: "taken" }
  | { kind: "not-found" };

// D1 answers a broken unique index with an error that names it.
function isNameTaken(error: unknown): boolean {
  return (
    error instanceof Error && /UNIQUE constraint failed/i.test(error.message)
  );
}

const OWNED_COLLECTION =
  '"collectionId" IN (SELECT "id" FROM "collection" WHERE "id" = ? AND "userId" = ?)';

// The person's collections with how many sheets each holds, A to Z.
export async function listCollections(
  db: D1Database,
  userId: string,
): Promise<CollectionListItem[]> {
  const { results } = await db
    .prepare(
      'SELECT c."id", c."name", count(cs."sheetId") AS "count" FROM "collection" c LEFT JOIN "collection_sheet" cs ON cs."collectionId" = c."id" WHERE c."userId" = ? GROUP BY c."id"',
    )
    .bind(userId)
    .all<CollectionListItem>();
  return sortedBy(results, (row) => row.name);
}

// The collection with its sheets, or null if the person has no such
// collection.
export async function readCollection(
  db: D1Database,
  userId: string,
  id: string,
): Promise<Collection | null> {
  const [collections, sheets] = await db.batch([
    db
      .prepare(
        'SELECT "id", "name" FROM "collection" WHERE "id" = ? AND "userId" = ?',
      )
      .bind(id, userId),
    db
      .prepare(
        `SELECT s."id", s."title", s."artist" FROM "collection_sheet" cs JOIN "sheet" s ON s."id" = cs."sheetId" WHERE ${OWNED_COLLECTION}`,
      )
      .bind(id, userId),
  ]);
  const row = collections?.results[0] as
    { id: string; name: string } | undefined;
  if (!row) return null;
  const rows = (sheets?.results ?? []) as {
    id: string;
    title: string;
    artist: string | null;
  }[];
  return {
    id: row.id,
    name: row.name,
    sheets: sortedBy(
      rows.map((sheet) => ({
        id: sheet.id,
        title: sheet.title,
        ...(sheet.artist === null ? {} : { artist: sheet.artist }),
      })),
      (sheet) => sheet.title,
    ),
  };
}

// Makes a collection. With `sheetId`, the collection starts with that sheet,
// if it is one of the person's.
export async function createCollection(
  db: D1Database,
  userId: string,
  input: { name: string; sheetId?: string },
): Promise<CollectionResult> {
  const name = keptCollectionName(input.name);
  if (name === null) return { kind: "invalid" };
  const collection = { id: newSheetId(), name };
  const now = Date.now();
  const insert = db
    .prepare(
      'INSERT INTO "collection" ("id", "userId", "name", "nameKey", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?)',
    )
    .bind(collection.id, userId, name, collectionNameKey(name), now, now);
  try {
    if (input.sheetId === undefined) {
      await insert.run();
    } else {
      await db.batch([
        insert,
        db
          .prepare(
            'INSERT INTO "collection_sheet" ("collectionId", "sheetId", "addedAt") SELECT ?, "id", ? FROM "sheet" WHERE "id" = ? AND "userId" = ?',
          )
          .bind(collection.id, now, input.sheetId, userId),
      ]);
    }
  } catch (error) {
    if (isNameTaken(error)) return { kind: "taken" };
    throw error;
  }
  return { kind: "saved", collection };
}

export async function renameCollection(
  db: D1Database,
  userId: string,
  id: string,
  text: string,
): Promise<CollectionResult> {
  const name = keptCollectionName(text);
  if (name === null) return { kind: "invalid" };
  try {
    const row = await db
      .prepare(
        'UPDATE "collection" SET "name" = ?, "nameKey" = ?, "updatedAt" = ? WHERE "id" = ? AND "userId" = ? RETURNING "id", "name"',
      )
      .bind(name, collectionNameKey(name), Date.now(), id, userId)
      .first<{ id: string; name: string }>();
    return row ? { kind: "saved", collection: row } : { kind: "not-found" };
  } catch (error) {
    if (isNameTaken(error)) return { kind: "taken" };
    throw error;
  }
}

// Returns whether a collection was deleted. Its sheets stay.
export async function deleteCollection(
  db: D1Database,
  userId: string,
  id: string,
): Promise<boolean> {
  const result = await db
    .prepare('DELETE FROM "collection" WHERE "id" = ? AND "userId" = ?')
    .bind(id, userId)
    .run();
  return result.meta.changes > 0;
}

// Adds sheets to a collection. Sheets already in it stay as they are.
// Returns false, and adds nothing, if the person has no such collection or
// one of the sheets isn't theirs. The ids go in as one JSON array, so many
// sheets still bind one value.
export async function addSheets(
  db: D1Database,
  userId: string,
  id: string,
  sheetIds: string[],
): Promise<boolean> {
  const ids = [...new Set(sheetIds)];
  const owned = await db
    .prepare(
      'SELECT (SELECT count(*) FROM "collection" WHERE "id" = ? AND "userId" = ?) AS "collections", (SELECT count(*) FROM "sheet" WHERE "userId" = ? AND "id" IN (SELECT "value" FROM json_each(?))) AS "sheets"',
    )
    .bind(id, userId, userId, JSON.stringify(ids))
    .first<{ collections: number; sheets: number }>();
  if (owned?.collections !== 1 || owned.sheets !== ids.length) return false;
  await db
    .prepare(
      `INSERT OR IGNORE INTO "collection_sheet" ("collectionId", "sheetId", "addedAt") SELECT c."id", s."id", ? FROM "collection" c JOIN "sheet" s ON s."userId" = c."userId" WHERE c."id" = ? AND c."userId" = ? AND s."id" IN (SELECT "value" FROM json_each(?))`,
    )
    .bind(Date.now(), id, userId, JSON.stringify(ids))
    .run();
  return true;
}

// Takes the sheet out of the collection, if it is in it. Returns false if the
// person has no such collection, so taking out a sheet twice isn't an error.
export async function removeSheet(
  db: D1Database,
  userId: string,
  id: string,
  sheetId: string,
): Promise<boolean> {
  const [, owned] = await db.batch([
    db
      .prepare(
        `DELETE FROM "collection_sheet" WHERE "sheetId" = ? AND ${OWNED_COLLECTION}`,
      )
      .bind(sheetId, id, userId),
    db
      .prepare('SELECT 1 FROM "collection" WHERE "id" = ? AND "userId" = ?')
      .bind(id, userId),
  ]);
  return (owned?.results.length ?? 0) > 0;
}

// The person's collections, A to Z, each with whether it holds the sheet,
// or null if the person has no such sheet.
export async function sheetCollections(
  db: D1Database,
  userId: string,
  sheetId: string,
): Promise<SheetCollection[] | null> {
  const [owned, collections] = await db.batch([
    db
      .prepare('SELECT 1 FROM "sheet" WHERE "id" = ? AND "userId" = ?')
      .bind(sheetId, userId),
    db
      .prepare(
        'SELECT c."id", c."name", EXISTS (SELECT 1 FROM "collection_sheet" cs WHERE cs."collectionId" = c."id" AND cs."sheetId" = ?) AS "holds" FROM "collection" c WHERE c."userId" = ?',
      )
      .bind(sheetId, userId),
  ]);
  if (!owned?.results.length) return null;
  const rows = (collections?.results ?? []) as {
    id: string;
    name: string;
    holds: number;
  }[];
  return sortedBy(
    rows.map((row) => ({ id: row.id, name: row.name, holds: row.holds === 1 })),
    (row) => row.name,
  );
}
