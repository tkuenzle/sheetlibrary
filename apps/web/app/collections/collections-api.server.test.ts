import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { testEnv } from "../db/local-env.test-helper";
import { seedSong } from "../editor/seed-song";
import { createSheet } from "../sheets/sheets.server";
import { addUser } from "../sheets/sheets.test-helper";
import {
  handleCollection,
  handleCollections,
  handleCollectionSheets,
  handleSheetCollection,
  handleSheetCollections,
} from "./collections-api.server";
import { readCollection } from "./collections.server";

function request(method: string, body?: unknown) {
  return new Request("https://sheetlibrary.com/api/collections", {
    method,
    ...(body === undefined
      ? {}
      : {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
  });
}

describe("collections API", () => {
  let test: Awaited<ReturnType<typeof testEnv>>;
  let db: D1Database;
  let sheetId: string;
  beforeEach(async () => {
    test = await testEnv();
    db = test.env.DB;
    await addUser(db, "ana");
    await addUser(db, "bo");
    ({ id: sheetId } = await createSheet(db, "ana", {
      title: "Stille Nacht",
      content: seedSong,
    }));
  });
  afterEach(() => test.dispose());

  async function make(name: string, userId = "ana") {
    const response = await handleCollections(
      request("POST", { name }),
      db,
      userId,
    );
    return {
      response,
      body: await response.json<{ id: string; name: string }>(),
    };
  }

  it("makes a collection and answers with it", async () => {
    const { response, body } = await make("  Christmas ");
    expect(response.status).toBe(201);
    expect(body).toEqual({
      id: expect.any(String) as string,
      name: "Christmas",
    });
  });

  it("answers 400 for a bad name and 409 for a name in use", async () => {
    await make("Christmas");
    const taken = await make("christmas");
    expect(taken.response.status).toBe(409);
    expect(taken.body).toEqual({
      error: "Name is already used",
      code: "taken",
    });
    const empty = await make("");
    expect(empty.response.status).toBe(400);
    expect(empty.body).toMatchObject({ code: "invalid" });
    const notJson = new Request("https://sheetlibrary.com/api/collections", {
      method: "POST",
      body: "name=Christmas",
    });
    expect((await handleCollections(notJson, db, "ana")).status).toBe(415);
  });

  it("answers 401 without a session and 405 for another method", async () => {
    expect(
      (await handleCollections(request("POST", { name: "X" }), db, null))
        .status,
    ).toBe(401);
    expect((await handleCollections(request("GET"), db, "ana")).status).toBe(
      405,
    );
  });

  it("renames and deletes a collection, and not someone else's", async () => {
    const { body } = await make("Christmas");
    await make("Campfire");
    const rename = (name: string, userId = "ana") =>
      handleCollection(request("PATCH", { name }), db, userId, body.id);
    const notTheirs = await rename("Mine", "bo");
    expect(notTheirs.status).toBe(404);
    expect(await notTheirs.json()).toMatchObject({ code: "not-found" });
    expect((await rename("campfire")).status).toBe(409);
    const renamed = await rename("Weihnachten");
    expect(await renamed.json()).toEqual({ id: body.id, name: "Weihnachten" });
    expect(
      (await handleCollection(request("DELETE"), db, "bo", body.id)).status,
    ).toBe(404);
    expect(
      (await handleCollection(request("DELETE"), db, "ana", body.id)).status,
    ).toBe(204);
    expect(await readCollection(db, "ana", body.id)).toBeNull();
  });

  it("lists a sheet's collections and adds it or takes it out", async () => {
    const { body } = await make("Christmas");
    const list = async (userId = "ana") =>
      handleSheetCollections(request("GET"), db, userId, sheetId);
    expect(await (await list()).json()).toEqual([
      { id: body.id, name: "Christmas", holds: false },
    ]);
    expect((await list("bo")).status).toBe(404);
    const set = (method: string, userId = "ana") =>
      handleSheetCollection(request(method), db, userId, sheetId, body.id);
    expect((await set("PUT")).status).toBe(204);
    expect((await set("PUT")).status).toBe(204);
    expect(await (await list()).json()).toEqual([
      { id: body.id, name: "Christmas", holds: true },
    ]);
    expect((await set("DELETE", "bo")).status).toBe(404);
    expect((await set("DELETE")).status).toBe(204);
    expect((await set("DELETE")).status).toBe(204);
    expect((await set("PATCH")).status).toBe(405);
  });

  it("refuses to add someone else's sheet", async () => {
    const { body } = await make("Shanties", "bo");
    expect(
      (await handleSheetCollection(request("PUT"), db, "bo", sheetId, body.id))
        .status,
    ).toBe(404);
  });

  it("makes a collection with the sheet in it", async () => {
    const response = await handleSheetCollections(
      request("POST", { name: "Christmas" }),
      db,
      "ana",
      sheetId,
    );
    expect(response.status).toBe(201);
    const { id } = await response.json<{ id: string }>();
    expect((await readCollection(db, "ana", id))?.sheets).toMatchObject([
      { id: sheetId, title: "Stille Nacht" },
    ]);
    expect(
      (
        await handleSheetCollections(
          request("POST", { name: "Mine" }),
          db,
          "bo",
          sheetId,
        )
      ).status,
    ).toBe(404);
  });

  // Requirement "Adding sheets": the ticked sheets, in one write.
  it("adds several sheets at once, and keeps those it holds", async () => {
    const { body } = await make("Christmas");
    const { id: other } = await createSheet(db, "ana", {
      title: "Drüü Könige",
      content: seedSong,
    });
    const add = (sheetIds: unknown, userId = "ana") =>
      handleCollectionSheets(
        request("POST", { sheetIds }),
        db,
        userId,
        body.id,
      );
    expect((await add([sheetId])).status).toBe(204);
    expect((await add([sheetId, other])).status).toBe(204);
    expect((await readCollection(db, "ana", body.id))?.sheets).toMatchObject([
      { id: other },
      { id: sheetId },
    ]);
  });

  it("adds nothing for someone else's collection or sheet, or a bad list", async () => {
    const { body } = await make("Christmas");
    const { id: theirs } = await createSheet(db, "bo", {
      title: "Shenandoah",
      content: seedSong,
    });
    const add = (sheetIds: unknown, userId = "ana") =>
      handleCollectionSheets(
        request("POST", { sheetIds }),
        db,
        userId,
        body.id,
      );
    const notTheirs = await add([sheetId], "bo");
    expect(notTheirs.status).toBe(404);
    expect(await notTheirs.json()).toMatchObject({ code: "not-found" });
    expect((await add([sheetId, theirs])).status).toBe(404);
    expect((await add([])).status).toBe(400);
    expect((await add("abc")).status).toBe(400);
    expect((await add([1])).status).toBe(400);
    expect(
      (await handleCollectionSheets(request("GET"), db, "ana", body.id)).status,
    ).toBe(405);
    expect(
      (
        await handleCollectionSheets(
          request("POST", { sheetIds: [sheetId] }),
          db,
          null,
          body.id,
        )
      ).status,
    ).toBe(401);
    expect((await readCollection(db, "ana", body.id))?.sheets).toEqual([]);
  });
});
