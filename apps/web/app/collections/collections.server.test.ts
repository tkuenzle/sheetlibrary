import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { testEnv } from "../db/local-env.test-helper";
import { seedSong } from "../editor/seed-song";
import {
  createSheet,
  deleteSheet,
  FIRST_REVISION,
  readSheet,
  saveSheet,
} from "../sheets/sheets.server";
import { addUser } from "../sheets/sheets.test-helper";
import {
  addSheets,
  createCollection,
  deleteCollection,
  listCollections,
  readCollection,
  removeSheet,
  renameCollection,
  sheetCollections,
} from "./collections.server";

describe("collection storage", () => {
  let test: Awaited<ReturnType<typeof testEnv>>;
  let db: D1Database;
  beforeEach(async () => {
    test = await testEnv();
    db = test.env.DB;
    await addUser(db, "ana");
    await addUser(db, "bo");
  });
  afterEach(() => test.dispose());

  async function sheet(title: string, userId = "ana") {
    const { id } = await createSheet(db, userId, { title, content: seedSong });
    return id;
  }

  async function collection(name: string, userId = "ana") {
    const result = await createCollection(db, userId, { name });
    if (result.kind !== "saved") throw new Error(result.kind);
    return result.collection.id;
  }

  // Scenario "One sheet, two collections".
  it("keeps a sheet in two collections", async () => {
    const stille = await sheet("Stille Nacht");
    const christmas = await collection("Christmas");
    const kinder = await collection("Kinderlieder");
    expect(await addSheets(db, "ana", christmas, [stille])).toBe(true);
    expect(await addSheets(db, "ana", kinder, [stille])).toBe(true);
    expect((await readCollection(db, "ana", christmas))?.sheets).toEqual([
      { id: stille, title: "Stille Nacht" },
    ]);
    expect((await readCollection(db, "ana", kinder))?.sheets).toHaveLength(1);
  });

  it("holds a sheet once, however often it is added", async () => {
    const stille = await sheet("Stille Nacht");
    const christmas = await collection("Christmas");
    await addSheets(db, "ana", christmas, [stille, stille]);
    expect(await addSheets(db, "ana", christmas, [stille])).toBe(true);
    expect(await listCollections(db, "ana")).toEqual([
      { id: christmas, name: "Christmas", count: 1 },
    ]);
  });

  // Scenario "Empty name".
  it("refuses a name that is empty or too long", async () => {
    expect(await createCollection(db, "ana", { name: "   " })).toEqual({
      kind: "invalid",
    });
    expect(await createCollection(db, "ana", { name: "x".repeat(41) })).toEqual(
      { kind: "invalid" },
    );
    const result = await createCollection(db, "ana", {
      name: `  ${"x".repeat(40)}  `,
    });
    expect(result).toMatchObject({
      kind: "saved",
      collection: { name: "x".repeat(40) },
    });
  });

  // Scenario "Same name in another case".
  it("refuses a name the person already uses, in any case", async () => {
    const christmas = await collection("Christmas");
    expect(await createCollection(db, "ana", { name: "christmas" })).toEqual({
      kind: "taken",
    });
    expect(await createCollection(db, "ana", { name: "Äpfel" })).toMatchObject({
      kind: "saved",
    });
    expect(await createCollection(db, "ana", { name: "äpfel" })).toEqual({
      kind: "taken",
    });
    const kinder = await collection("Kinderlieder");
    expect(await renameCollection(db, "ana", kinder, "CHRISTMAS")).toEqual({
      kind: "taken",
    });
    expect(await renameCollection(db, "ana", christmas, "christmas")).toEqual({
      kind: "saved",
      collection: { id: christmas, name: "christmas" },
    });
    expect(await listCollections(db, "ana")).toHaveLength(3);
  });

  it("lets another person use the same name", async () => {
    await collection("Christmas");
    expect(
      await createCollection(db, "bo", { name: "Christmas" }),
    ).toMatchObject({ kind: "saved" });
  });

  // Scenario "Someone else's collection".
  it("treats someone else's collection as missing", async () => {
    const christmas = await collection("Christmas");
    const boSheet = await sheet("Shenandoah", "bo");
    expect(await readCollection(db, "bo", christmas)).toBeNull();
    expect(await listCollections(db, "bo")).toEqual([]);
    expect(await renameCollection(db, "bo", christmas, "Mine")).toEqual({
      kind: "not-found",
    });
    expect(await addSheets(db, "bo", christmas, [boSheet])).toBe(false);
    expect(await deleteCollection(db, "bo", christmas)).toBe(false);
    expect(await readCollection(db, "ana", christmas)).toMatchObject({
      name: "Christmas",
      sheets: [],
    });
  });

  // Scenario "Adding someone else's sheet".
  it("refuses someone else's sheet and adds nothing", async () => {
    const stille = await sheet("Stille Nacht");
    const shenandoah = await sheet("Shenandoah", "bo");
    const christmas = await collection("Christmas");
    expect(await addSheets(db, "ana", christmas, [stille, shenandoah])).toBe(
      false,
    );
    expect(await addSheets(db, "ana", christmas, ["no-such-sheet"])).toBe(
      false,
    );
    expect((await readCollection(db, "ana", christmas))?.sheets).toEqual([]);
  });

  it("removes a sheet from a collection and keeps the sheet", async () => {
    const stille = await sheet("Stille Nacht");
    const christmas = await collection("Christmas");
    await addSheets(db, "ana", christmas, [stille]);
    expect(await removeSheet(db, "bo", christmas, stille)).toBe(false);
    expect(await removeSheet(db, "ana", christmas, stille)).toBe(true);
    expect((await readCollection(db, "ana", christmas))?.sheets).toEqual([]);
    expect(await removeSheet(db, "ana", christmas, stille)).toBe(true);
    expect(await readSheet(db, "ana", stille)).not.toBeNull();
  });

  // Scenario "Adding while the editor is open".
  it("leaves the sheet's revision when it is added or removed", async () => {
    const stille = await sheet("Stille Nacht");
    const loaded = await readSheet(db, "ana", stille);
    if (!loaded) throw new Error("No sheet");
    const christmas = await collection("Christmas");
    await addSheets(db, "ana", christmas, [stille]);
    await removeSheet(db, "ana", christmas, stille);
    await addSheets(db, "ana", christmas, [stille]);
    expect(await saveSheet(db, "ana", loaded)).toEqual({
      kind: "saved",
      revision: FIRST_REVISION + 1,
    });
  });

  // Scenario "Deleting a collection".
  it("keeps the sheets when a collection is deleted", async () => {
    const stille = await sheet("Stille Nacht");
    const christmas = await collection("Christmas");
    await addSheets(db, "ana", christmas, [stille]);
    expect(await deleteCollection(db, "ana", christmas)).toBe(true);
    expect(await readCollection(db, "ana", christmas)).toBeNull();
    expect(await readSheet(db, "ana", stille)).not.toBeNull();
  });

  // Scenario "Deleting a sheet".
  it("takes a deleted sheet out of its collections", async () => {
    const stille = await sheet("Stille Nacht");
    const drue = await sheet("Drüü Könige");
    const christmas = await collection("Christmas");
    await addSheets(db, "ana", christmas, [stille, drue]);
    await deleteSheet(db, "ana", stille);
    expect(await listCollections(db, "ana")).toEqual([
      { id: christmas, name: "Christmas", count: 1 },
    ]);
  });

  it("sorts collections and their sheets A to Z, as people read it", async () => {
    const ids = {
      stille: await sheet("Stille Nacht"),
      drue: await sheet("Drüü Könige"),
      lied10: await sheet("Lied 10"),
      lied2: await sheet("Lied 2"),
      alle: await sheet("alle meine Entchen"),
    };
    const kinder = await collection("Kinderlieder");
    await collection("Christmas");
    await collection("campfire");
    await addSheets(db, "ana", kinder, Object.values(ids));
    expect((await listCollections(db, "ana")).map((c) => c.name)).toEqual([
      "campfire",
      "Christmas",
      "Kinderlieder",
    ]);
    expect(
      (await readCollection(db, "ana", kinder))?.sheets.map((s) => s.title),
    ).toEqual([
      "alle meine Entchen",
      "Drüü Könige",
      "Lied 2",
      "Lied 10",
      "Stille Nacht",
    ]);
  });

  it("makes a collection that starts with a sheet", async () => {
    const stille = await sheet("Stille Nacht");
    const result = await createCollection(db, "ana", {
      name: "Christmas",
      sheetId: stille,
    });
    if (result.kind !== "saved") throw new Error(result.kind);
    expect(
      (await readCollection(db, "ana", result.collection.id))?.sheets,
    ).toEqual([{ id: stille, title: "Stille Nacht" }]);
  });

  it("lists the collections with whether they hold the sheet", async () => {
    const stille = await sheet("Stille Nacht");
    const kinder = await collection("Kinderlieder");
    const christmas = await collection("Christmas");
    await addSheets(db, "ana", kinder, [stille]);
    expect(await sheetCollections(db, "ana", stille)).toEqual([
      { id: christmas, name: "Christmas", holds: false },
      { id: kinder, name: "Kinderlieder", holds: true },
    ]);
    expect(await sheetCollections(db, "bo", stille)).toBeNull();
  });
});
