import { describe, expect, it, vi } from "vitest";

import {
  changeVersion,
  deleteVersion,
  keptVersionName,
  readVersionKey,
  saveVersion,
} from "./versions";

function answering(response: Response | Error) {
  return vi.fn(() =>
    response instanceof Error
      ? Promise.reject(response)
      : Promise.resolve(response),
  );
}

const anna = { id: "v1234567890a", name: "Anna's key", key: "A" };

describe("version rules", () => {
  it("keeps a trimmed name of 1 to 40 characters", () => {
    expect(keptVersionName("  Anna's key ")).toBe("Anna's key");
    expect(keptVersionName("   ")).toBeNull();
    expect(keptVersionName("x".repeat(40))).toBe("x".repeat(40));
    expect(keptVersionName("x".repeat(41))).toBeNull();
  });

  it("reads a key as written", () => {
    expect(readVersionKey("A")).toEqual({ tonic: "A", minor: false });
    expect(readVersionKey("F#m")).toEqual({ tonic: "F#", minor: true });
    expect(readVersionKey("Bb")).toEqual({ tonic: "Bb", minor: false });
    expect(readVersionKey("H")).toBeNull();
    expect(readVersionKey("Am7")).toBeNull();
  });
});

describe("the versions API from the browser", () => {
  it("saves a version", async () => {
    const fetch = answering(Response.json(anna, { status: 201 }));
    expect(
      await saveVersion(
        "abcdefghijkl",
        { name: "Anna's key", key: "A" },
        fetch,
      ),
    ).toEqual(anna);
    expect(fetch).toHaveBeenCalledWith("/api/sheets/abcdefghijkl/versions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Anna's key", key: "A" }),
    });
  });

  it("changes a version's key", async () => {
    const fetch = answering(Response.json({ ...anna, key: "Bb" }));
    expect(
      await changeVersion("abcdefghijkl", anna.id, { key: "Bb" }, fetch),
    ).toEqual({ ...anna, key: "Bb" });
    expect(fetch).toHaveBeenCalledWith(
      `/api/sheets/abcdefghijkl/versions/${anna.id}`,
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("deletes a version, and counts one already gone as deleted", async () => {
    await expect(
      deleteVersion(
        "abcdefghijkl",
        anna.id,
        answering(new Response(null, { status: 204 })),
      ),
    ).resolves.toBeUndefined();
    await expect(
      deleteVersion(
        "abcdefghijkl",
        anna.id,
        answering(new Response(null, { status: 404 })),
      ),
    ).resolves.toBeUndefined();
  });

  it("throws when the server refuses or can't be reached", async () => {
    await expect(
      saveVersion(
        "abcdefghijkl",
        { name: "", key: "A" },
        answering(Response.json({}, { status: 400 })),
      ),
    ).rejects.toThrow();
    await expect(
      changeVersion(
        "abcdefghijkl",
        anna.id,
        { name: "Anna" },
        answering(new TypeError("offline")),
      ),
    ).rejects.toThrow();
    await expect(
      deleteVersion(
        "abcdefghijkl",
        anna.id,
        answering(new Response(null, { status: 500 })),
      ),
    ).rejects.toThrow();
  });
});
