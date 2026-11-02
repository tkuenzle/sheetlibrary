import type { Sheet } from "chordsheet";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { testEnv } from "../db/local-env.test-helper";
import { seedSong } from "../editor/seed-song";
import { handleSheet, handleSheets, maxSheetBytes } from "./sheets-api.server";
import { addUser } from "./sheets.test-helper";

const base = "https://sheetlibrary.com/api/sheets";

function request(method: string, path = "", body?: unknown) {
  return new Request(`${base}${path}`, {
    method,
    ...(body === undefined
      ? {}
      : {
          headers: { "Content-Type": "application/json" },
          body: typeof body === "string" ? body : JSON.stringify(body),
        }),
  });
}

describe("sheets API", () => {
  let test: Awaited<ReturnType<typeof testEnv>>;
  let db: D1Database;
  beforeEach(async () => {
    test = await testEnv();
    db = test.env.DB;
    await addUser(db, "ana");
    await addUser(db, "bo");
  });
  afterEach(() => test.dispose());

  async function create(userId = "ana"): Promise<Sheet> {
    const response = await handleSheets(
      request("POST", "", { title: "Amazing Grace", content: seedSong }),
      db,
      userId,
    );
    expect(response.status).toBe(201);
    return response.json();
  }

  // Scenario "Create and read back".
  it("creates a sheet and reads it back", async () => {
    const sheet = await create();
    const response = await handleSheet(
      request("GET", `/${sheet.id}`),
      db,
      "ana",
      sheet.id,
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: sheet.id,
      revision: 1,
      title: "Amazing Grace",
      content: seedSong,
    });
  });

  // Scenario "Not signed in".
  it("refuses requests without a session", async () => {
    const sheet = await create();
    expect(
      (
        await handleSheets(
          request("POST", "", { title: "A", content: seedSong }),
          db,
          null,
        )
      ).status,
    ).toBe(401);
    for (const method of ["GET", "PUT", "DELETE"]) {
      const response = await handleSheet(
        request(method, `/${sheet.id}`, method === "PUT" ? sheet : undefined),
        db,
        null,
        sheet.id,
      );
      expect(response.status).toBe(401);
    }
  });

  // Scenario "Someone else's sheet".
  it("answers 404 for someone else's sheet, as for an unknown id", async () => {
    const sheet = await create();
    for (const method of ["GET", "PUT", "DELETE"]) {
      const response = await handleSheet(
        request(method, `/${sheet.id}`, method === "PUT" ? sheet : undefined),
        db,
        "bo",
        sheet.id,
      );
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: "Sheet not found" });
    }
    const unknown = await handleSheet(
      request("GET", "/AAAAAAAAAAAA"),
      db,
      "ana",
      "AAAAAAAAAAAA",
    );
    expect(unknown.status).toBe(404);
  });

  it("saves on the current revision and answers the new one", async () => {
    const sheet = await create();
    const response = await handleSheet(
      request("PUT", `/${sheet.id}`, { ...sheet, title: "Amazing Grace (G)" }),
      db,
      "ana",
      sheet.id,
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ revision: 2 });
  });

  // Scenario "Two tabs" (sheet-storage).
  it("answers 409 for a save on an old revision", async () => {
    const sheet = await create();
    await handleSheet(
      request("PUT", `/${sheet.id}`, sheet),
      db,
      "ana",
      sheet.id,
    );
    const response = await handleSheet(
      request("PUT", `/${sheet.id}`, { ...sheet, title: "Second tab" }),
      db,
      "ana",
      sheet.id,
    );
    expect(response.status).toBe(409);
  });

  // Scenario "Invalid sheet".
  it("answers 400 for a sheet that breaks the rules", async () => {
    const sheet = await create();
    const untitled: Partial<Sheet> = { ...sheet };
    delete untitled.title;
    const response = await handleSheet(
      request("PUT", `/${sheet.id}`, untitled),
      db,
      "ana",
      sheet.id,
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      problems: [{ field: "title" }],
    });
    const stored = await handleSheet(
      request("GET", `/${sheet.id}`),
      db,
      "ana",
      sheet.id,
    );
    expect(await stored.json()).toEqual(sheet);
  });

  it("answers 400 for a new sheet that breaks the rules", async () => {
    const response = await handleSheets(
      request("POST", "", { content: seedSong }),
      db,
      "ana",
    );
    expect(response.status).toBe(400);
  });

  it("answers 400 for a body that isn't JSON", async () => {
    const response = await handleSheets(request("POST", "", "{"), db, "ana");
    expect(response.status).toBe(400);
  });

  it("answers 415 for a body that doesn't say it is JSON", async () => {
    const response = await handleSheets(
      new Request(base, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ title: "Amazing Grace", content: seedSong }),
      }),
      db,
      "ana",
    );
    expect(response.status).toBe(415);
  });

  it("answers 400 for a body over the size limit", async () => {
    const sheet = await create();
    const response = await handleSheet(
      request("PUT", `/${sheet.id}`, {
        ...sheet,
        title: "x".repeat(maxSheetBytes),
      }),
      db,
      "ana",
      sheet.id,
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Sheet is too large" });
  });

  it("answers 400 when the id doesn't match the URL", async () => {
    const sheet = await create();
    const other = await create();
    const response = await handleSheet(
      request("PUT", `/${sheet.id}`, other),
      db,
      "ana",
      sheet.id,
    );
    expect(response.status).toBe(400);
  });

  it("deletes a sheet", async () => {
    const sheet = await create();
    const response = await handleSheet(
      request("DELETE", `/${sheet.id}`),
      db,
      "ana",
      sheet.id,
    );
    expect(response.status).toBe(204);
    const gone = await handleSheet(
      request("GET", `/${sheet.id}`),
      db,
      "ana",
      sheet.id,
    );
    expect(gone.status).toBe(404);
  });

  it("answers 405 for other methods", async () => {
    expect((await handleSheets(request("GET"), db, "ana")).status).toBe(405);
    expect(
      (await handleSheet(request("POST", "/x"), db, "ana", "x")).status,
    ).toBe(405);
  });
});
