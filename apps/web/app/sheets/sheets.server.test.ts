import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { testEnv } from "../db/local-env.test-helper";
import { seedSong } from "../editor/seed-song";
import {
  changeVersion,
  createSheet,
  createVersion,
  deleteSheet,
  deleteVersion,
  FIRST_REVISION,
  listSheets,
  listVersions,
  readSheet,
  saveSheet,
} from "./sheets.server";
import { addUser } from "./sheets.test-helper";

describe("sheet storage", () => {
  let test: Awaited<ReturnType<typeof testEnv>>;
  let db: D1Database;
  beforeEach(async () => {
    test = await testEnv();
    db = test.env.DB;
    await addUser(db, "ana");
    await addUser(db, "bo");
  });
  afterEach(() => test.dispose());

  it("creates a sheet and reads it back", async () => {
    const created = await createSheet(db, "ana", {
      title: "Amazing Grace",
      content: seedSong,
    });
    expect(created.revision).toBe(FIRST_REVISION);
    expect(await readSheet(db, "ana", created.id)).toEqual({
      id: created.id,
      revision: FIRST_REVISION,
      title: "Amazing Grace",
      content: seedSong,
    });
  });

  it("keeps the artist", async () => {
    const { id } = await createSheet(db, "ana", {
      title: "Amazing Grace",
      artist: "Judy Collins",
      content: seedSong,
    });
    expect(await readSheet(db, "ana", id)).toMatchObject({
      artist: "Judy Collins",
    });
  });

  it("saves on the current revision and raises it", async () => {
    const sheet = await createSheet(db, "ana", {
      title: "Amazing Grace",
      content: seedSong,
    });
    const result = await saveSheet(db, "ana", {
      ...sheet,
      title: "Amazing Grace (G)",
    });
    expect(result).toEqual({ kind: "saved", revision: FIRST_REVISION + 1 });
    expect(await readSheet(db, "ana", sheet.id)).toMatchObject({
      revision: FIRST_REVISION + 1,
      title: "Amazing Grace (G)",
    });
  });

  it("refuses the second of two saves on the same revision", async () => {
    const sheet = await createSheet(db, "ana", {
      title: "Amazing Grace",
      content: seedSong,
    });
    await saveSheet(db, "ana", { ...sheet, title: "First tab" });
    expect(
      await saveSheet(db, "ana", { ...sheet, title: "Second tab" }),
    ).toEqual({ kind: "stale" });
    expect(await readSheet(db, "ana", sheet.id)).toMatchObject({
      title: "First tab",
    });
  });

  it("treats someone else's sheet as missing", async () => {
    const sheet = await createSheet(db, "ana", {
      title: "Amazing Grace",
      content: seedSong,
    });
    expect(await readSheet(db, "bo", sheet.id)).toBeNull();
    expect(await saveSheet(db, "bo", { ...sheet, title: "Mine" })).toEqual({
      kind: "not-found",
    });
    expect(await deleteSheet(db, "bo", sheet.id)).toBe(false);
    expect(await readSheet(db, "ana", sheet.id)).toMatchObject({
      title: "Amazing Grace",
      revision: FIRST_REVISION,
    });
  });

  it("deletes a sheet", async () => {
    const { id } = await createSheet(db, "ana", {
      title: "Amazing Grace",
      content: seedSong,
    });
    expect(await deleteSheet(db, "ana", id)).toBe(true);
    expect(await readSheet(db, "ana", id)).toBeNull();
  });

  // Scenario "Newest edit first".
  it("lists a person's sheets, the most recently edited first", async () => {
    const now = vi.spyOn(Date, "now");
    now.mockReturnValue(1000);
    const hallelujah = await createSheet(db, "ana", {
      title: "Hallelujah",
      artist: "Leonard Cohen",
      content: seedSong,
    });
    now.mockReturnValue(2000);
    const grace = await createSheet(db, "ana", {
      title: "Amazing Grace",
      content: seedSong,
    });
    now.mockReturnValue(3000);
    await saveSheet(db, "ana", hallelujah);
    now.mockRestore();
    expect(await listSheets(db, "ana")).toEqual([
      {
        id: hallelujah.id,
        title: "Hallelujah",
        artist: "Leonard Cohen",
        updatedAt: 3000,
      },
      { id: grace.id, title: "Amazing Grace", updatedAt: 2000 },
    ]);
  });

  // Scenario "Someone else's sheets".
  it("lists no one else's sheets", async () => {
    await createSheet(db, "bo", { title: "Shenandoah", content: seedSong });
    expect(await listSheets(db, "ana")).toEqual([]);
  });
});

describe("version storage", () => {
  let test: Awaited<ReturnType<typeof testEnv>>;
  let db: D1Database;
  let sheetId: string;
  beforeEach(async () => {
    test = await testEnv();
    db = test.env.DB;
    await addUser(db, "ana");
    await addUser(db, "bo");
    ({ id: sheetId } = await createSheet(db, "ana", {
      title: "Amazing Grace",
      content: seedSong,
    }));
  });
  afterEach(() => test.dispose());

  async function save(name: string, key: string) {
    const result = await createVersion(db, "ana", sheetId, { name, key });
    if (result.kind !== "saved") throw new Error(result.kind);
    return result.version;
  }

  it("saves versions and lists them in the order they were saved", async () => {
    const anna = await save("  Anna's key ", "A");
    const band = await save("Sunday band", "Bb");
    expect(anna.name).toBe("Anna's key");
    expect(await listVersions(db, "ana", sheetId)).toEqual([anna, band]);
  });

  it("allows the same name and key twice", async () => {
    await save("Anna's key", "A");
    await save("Anna's key", "A");
    expect(await listVersions(db, "ana", sheetId)).toHaveLength(2);
  });

  // Scenario "Empty name".
  it("refuses a name that is empty or too long, and a key that isn't one", async () => {
    for (const input of [
      { name: "   ", key: "A" },
      { name: "x".repeat(41), key: "A" },
      { name: "Anna's key", key: "H" },
    ]) {
      expect(await createVersion(db, "ana", sheetId, input)).toEqual({
        kind: "invalid",
      });
    }
    expect(await listVersions(db, "ana", sheetId)).toEqual([]);
  });

  it("renames a version and gives it another key", async () => {
    const anna = await save("Anna's key", "A");
    expect(
      await changeVersion(db, "ana", sheetId, anna.id, { key: "Bb" }),
    ).toEqual({ kind: "saved", version: { ...anna, key: "Bb" } });
    expect(
      await changeVersion(db, "ana", sheetId, anna.id, { name: "Anna" }),
    ).toEqual({ kind: "saved", version: { ...anna, name: "Anna", key: "Bb" } });
    expect(
      await changeVersion(db, "ana", sheetId, anna.id, { name: "" }),
    ).toEqual({ kind: "invalid" });
  });

  it("deletes a version", async () => {
    const anna = await save("Anna's key", "A");
    expect(await deleteVersion(db, "ana", sheetId, anna.id)).toBe(true);
    expect(await deleteVersion(db, "ana", sheetId, anna.id)).toBe(false);
    expect(await listVersions(db, "ana", sheetId)).toEqual([]);
  });

  // Scenario "Someone else's version".
  it("treats someone else's versions as missing", async () => {
    const anna = await save("Anna's key", "A");
    expect(await listVersions(db, "bo", sheetId)).toBeNull();
    expect(
      await createVersion(db, "bo", sheetId, { name: "Mine", key: "C" }),
    ).toEqual({ kind: "not-found" });
    expect(
      await changeVersion(db, "bo", sheetId, anna.id, { name: "Mine" }),
    ).toEqual({ kind: "not-found" });
    expect(await deleteVersion(db, "bo", sheetId, anna.id)).toBe(false);
    expect(await listVersions(db, "ana", sheetId)).toEqual([anna]);
  });

  it("finds a version only under its own sheet", async () => {
    const anna = await save("Anna's key", "A");
    const other = await createSheet(db, "ana", {
      title: "Shenandoah",
      content: seedSong,
    });
    expect(await deleteVersion(db, "ana", other.id, anna.id)).toBe(false);
  });

  // Scenario "Saving while the editor is open".
  it("leaves the sheet's revision when a version changes", async () => {
    const sheet = await readSheet(db, "ana", sheetId);
    if (!sheet) throw new Error("No sheet");
    const anna = await save("Anna's key", "A");
    await changeVersion(db, "ana", sheetId, anna.id, { key: "Bb" });
    await deleteVersion(db, "ana", sheetId, anna.id);
    expect(await saveSheet(db, "ana", sheet)).toEqual({
      kind: "saved",
      revision: FIRST_REVISION + 1,
    });
  });

  // Scenario "Deleting the sheet".
  it("deletes the versions with their sheet", async () => {
    await save("Anna's key", "A");
    await save("Sunday band", "Bb");
    await deleteSheet(db, "ana", sheetId);
    const left = await db
      .prepare('SELECT count(*) AS n FROM "sheet_version"')
      .first<{ n: number }>();
    expect(left?.n).toBe(0);
  });
});
