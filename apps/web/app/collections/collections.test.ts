import { describe, expect, it, vi } from "vitest";

import { NameRefused } from "../ui/name-dialog";
import {
  collectionNameKey,
  keptCollectionName,
  sheetCount,
  sortedBy,
} from "./collections";
import {
  createCollection,
  deleteCollection,
  listSheetCollections,
  NAME_TAKEN,
  renameCollection,
  setInCollection,
} from "./collections-client";

function answering(response: Response | Error) {
  return vi.fn(() =>
    response instanceof Error
      ? Promise.reject(response)
      : Promise.resolve(response),
  );
}

const christmas = { id: "c1234567890a", name: "Christmas" };

describe("collection rules", () => {
  it("keeps a trimmed name of 1 to 40 characters", () => {
    expect(keptCollectionName("  Christmas ")).toBe("Christmas");
    expect(keptCollectionName("   ")).toBeNull();
    expect(keptCollectionName("x".repeat(40))).toBe("x".repeat(40));
    expect(keptCollectionName("x".repeat(41))).toBeNull();
  });

  it("gives names that differ only in case the same key", () => {
    expect(collectionNameKey("Christmas")).toBe(collectionNameKey("christmas"));
    expect(collectionNameKey("Äpfel")).toBe(collectionNameKey("äpfel"));
    // "Ä" as A and a combining diaeresis.
    expect(collectionNameKey("Äpfel")).toBe(collectionNameKey("Äpfel"));
  });

  it("sorts as people read it", () => {
    expect(
      sortedBy(["Lied 10", "Drüü Könige", "lied 2", "Campfire"], (s) => s),
    ).toEqual(["Campfire", "Drüü Könige", "lied 2", "Lied 10"]);
  });

  it("counts sheets", () => {
    expect(sheetCount(0)).toBe("0 sheets");
    expect(sheetCount(1)).toBe("1 sheet");
    expect(sheetCount(14)).toBe("14 sheets");
  });
});

describe("the collections API from the browser", () => {
  it("makes a collection, with or without a sheet", async () => {
    const fetch = answering(Response.json(christmas, { status: 201 }));
    expect(await createCollection("Christmas", undefined, fetch)).toEqual(
      christmas,
    );
    expect(fetch).toHaveBeenCalledWith("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"name":"Christmas"}',
    });
    const withSheet = answering(Response.json(christmas, { status: 201 }));
    await createCollection("Christmas", "s1234567890a", withSheet);
    expect(withSheet).toHaveBeenCalledWith(
      "/api/sheets/s1234567890a/collections",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("throws a NameRefused for a name in use, and an Error otherwise", async () => {
    const taken = renameCollection(
      christmas.id,
      "Campfire",
      answering(Response.json({}, { status: 409 })),
    );
    await expect(taken).rejects.toEqual(new NameRefused(NAME_TAKEN));
    await expect(
      renameCollection(
        christmas.id,
        "Campfire",
        answering(Response.json({}, { status: 500 })),
      ),
    ).rejects.not.toBeInstanceOf(NameRefused);
    await expect(
      createCollection("X", undefined, answering(new TypeError("offline"))),
    ).rejects.toThrow("offline");
  });

  it("deletes a collection, and counts one already gone as deleted", async () => {
    const fetch = answering(new Response(null, { status: 404 }));
    await deleteCollection(christmas.id, fetch);
    expect(fetch).toHaveBeenCalledWith("/api/collections/c1234567890a", {
      method: "DELETE",
    });
    await expect(
      deleteCollection(
        christmas.id,
        answering(new Response(null, { status: 500 })),
      ),
    ).rejects.toThrow();
  });

  it("lists a sheet's collections and adds it or takes it out", async () => {
    const list = [{ ...christmas, holds: true }];
    expect(
      await listSheetCollections(
        "s1234567890a",
        answering(Response.json(list)),
      ),
    ).toEqual(list);
    const fetch = answering(new Response(null, { status: 204 }));
    await setInCollection("s1234567890a", christmas.id, true, fetch);
    await setInCollection("s1234567890a", christmas.id, false, fetch);
    expect(fetch.mock.calls).toEqual([
      ["/api/sheets/s1234567890a/collections/c1234567890a", { method: "PUT" }],
      [
        "/api/sheets/s1234567890a/collections/c1234567890a",
        { method: "DELETE" },
      ],
    ]);
  });
});
