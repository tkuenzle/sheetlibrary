import { describe, expect, it, vi } from "vitest";

import { seedSong } from "../editor/seed-song";
import { importSheet, NOT_IMPORTED, TOO_LONG } from "./import";

function answering(response: Response | Error) {
  return vi.fn(() =>
    response instanceof Error
      ? Promise.reject(response)
      : Promise.resolve(response),
  );
}

describe("importSheet", () => {
  // Scenario "Importing a song".
  it("creates an Untitled sheet through the API", async () => {
    const fetch = answering(
      Response.json({ id: "abcdefghijkl" }, { status: 201 }),
    );
    expect(await importSheet(seedSong, fetch)).toEqual({ id: "abcdefghijkl" });
    expect(fetch).toHaveBeenCalledWith("/api/sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled", content: seedSong }),
    });
  });

  // Scenario "Too large".
  it("says when the text is too long", async () => {
    const fetch = answering(
      Response.json({ error: "Sheet is too large" }, { status: 400 }),
    );
    expect(await importSheet(seedSong, fetch)).toEqual({ error: TOO_LONG });
  });

  it("says when the server refuses for another reason", async () => {
    const fetch = answering(
      Response.json({ error: "Sheet is not valid" }, { status: 400 }),
    );
    expect(await importSheet(seedSong, fetch)).toEqual({
      error: NOT_IMPORTED,
    });
    expect(
      await importSheet(
        seedSong,
        answering(new Response(null, { status: 503 })),
      ),
    ).toEqual({ error: NOT_IMPORTED });
  });

  it("says when the network is down", async () => {
    expect(
      await importSheet(seedSong, answering(new TypeError("Failed to fetch"))),
    ).toEqual({ error: NOT_IMPORTED });
  });
});
