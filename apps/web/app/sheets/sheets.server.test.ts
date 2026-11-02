import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { testEnv } from "../db/local-env.test-helper";
import { seedSong } from "../editor/seed-song";
import {
  createSheet,
  deleteSheet,
  FIRST_REVISION,
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
});
