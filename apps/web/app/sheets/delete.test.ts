import { describe, expect, it, vi } from "vitest";

import { deleteStoredSheet } from "./delete";

function answering(response: Response | Error) {
  return vi.fn(() =>
    response instanceof Error
      ? Promise.reject(response)
      : Promise.resolve(response),
  );
}

describe("deleteStoredSheet", () => {
  // Scenario "Deleting".
  it("deletes the sheet through the API", async () => {
    const fetch = answering(new Response(null, { status: 204 }));
    await deleteStoredSheet("abcdefghijkl", fetch);
    expect(fetch).toHaveBeenCalledWith("/api/sheets/abcdefghijkl", {
      method: "DELETE",
    });
  });

  it("counts a sheet that is already gone as deleted", async () => {
    await expect(
      deleteStoredSheet(
        "abcdefghijkl",
        answering(new Response(null, { status: 404 })),
      ),
    ).resolves.toBeUndefined();
  });

  // Scenario "Offline".
  it("fails when the network is down", async () => {
    await expect(
      deleteStoredSheet(
        "abcdefghijkl",
        answering(new TypeError("Failed to fetch")),
      ),
    ).rejects.toThrow();
  });

  it("fails when the server refuses", async () => {
    await expect(
      deleteStoredSheet(
        "abcdefghijkl",
        answering(new Response(null, { status: 503 })),
      ),
    ).rejects.toThrow();
  });
});
