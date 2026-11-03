import type { Sheet, SheetContent } from "chordsheet";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { seedSong } from "../editor/seed-song";
import { Autosave, type SaveState } from "./autosave";

const sheet: Sheet = {
  id: "abcdefghijkl",
  revision: 1,
  title: "Amazing Grace",
  content: seedSong,
};

// A fetch whose answers the test hands out one by one.
function fakeFetch() {
  const pending: {
    body: Sheet;
    answer: (response: Response | Error) => Promise<void>;
  }[] = [];
  const fetch = vi.fn((_url: string, init: RequestInit) => {
    let settle!: (response: Response | Error) => void;
    const promise = new Promise<Response>((resolve, reject) => {
      settle = (response) => {
        if (response instanceof Error) reject(response);
        else resolve(response);
      };
    });
    pending.push({
      body: JSON.parse(init.body as string) as Sheet,
      answer: async (response) => {
        settle(response);
        // Lets the save handle the answer.
        await vi.advanceTimersByTimeAsync(0);
      },
    });
    return promise;
  });
  return { fetch, pending };
}

describe("autosave", () => {
  let states: SaveState[];
  let content: SheetContent | null;
  let details: Pick<Sheet, "title" | "artist">;
  let net: ReturnType<typeof fakeFetch>;
  let autosave: Autosave;

  beforeEach(() => {
    vi.useFakeTimers();
    states = [];
    content = seedSong;
    details = { title: sheet.title };
    net = fakeFetch();
    autosave = new Autosave({
      sheet,
      read: () => content && { ...details, content },
      onState: (state) => states.push(state),
      fetch: net.fetch as unknown as typeof fetch,
    });
  });
  afterEach(() => {
    autosave.stop();
    vi.useRealTimers();
  });

  const saved = (revision: number) => Response.json({ revision });

  it("saves once edits pause, on the loaded revision", async () => {
    autosave.edited();
    await vi.advanceTimersByTimeAsync(500);
    autosave.edited();
    await vi.advanceTimersByTimeAsync(999);
    expect(net.fetch).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(net.fetch).toHaveBeenCalledTimes(1);
    expect(net.fetch.mock.lastCall?.[0]).toBe("/api/sheets/abcdefghijkl");
    expect(net.pending[0]?.body).toEqual(sheet);
    await net.pending[0]?.answer(saved(2));
    expect(states).toEqual(["waiting", "saving", "saved"]);
  });

  it("saves the next edits on the new revision", async () => {
    autosave.edited();
    await vi.advanceTimersByTimeAsync(1000);
    await net.pending[0]?.answer(saved(2));
    autosave.edited();
    await vi.advanceTimersByTimeAsync(1000);
    expect(net.pending[1]?.body.revision).toBe(2);
  });

  it("keeps one save in flight, and sends edits made meanwhile after it", async () => {
    autosave.edited();
    await vi.advanceTimersByTimeAsync(1000);
    autosave.edited();
    await vi.advanceTimersByTimeAsync(2000);
    expect(net.fetch).toHaveBeenCalledTimes(1);
    await net.pending[0]?.answer(saved(2));
    expect(states.at(-1)).toBe("waiting");
    await vi.advanceTimersByTimeAsync(1000);
    expect(net.fetch).toHaveBeenCalledTimes(2);
    expect(net.pending[1]?.body.revision).toBe(2);
  });

  // Scenario "Typing without a pause".
  it("saves within 5 seconds while edits keep coming", async () => {
    for (let t = 0; t < 4500; t += 500) {
      autosave.edited();
      await vi.advanceTimersByTimeAsync(500);
    }
    expect(net.fetch).not.toHaveBeenCalled();
    autosave.edited();
    await vi.advanceTimersByTimeAsync(500);
    expect(net.fetch).toHaveBeenCalledTimes(1);
  });

  it("still saves after a pause, before the longest wait", async () => {
    for (let t = 0; t < 3000; t += 500) {
      autosave.edited();
      await vi.advanceTimersByTimeAsync(500);
    }
    // The last edit was at 2.5s.
    await vi.advanceTimersByTimeAsync(499);
    expect(net.fetch).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(net.fetch).toHaveBeenCalledTimes(1);
  });

  it("sends edits made during a save within 5 seconds of the first", async () => {
    autosave.edited();
    await vi.advanceTimersByTimeAsync(1000);
    // A slow save. Edits keep coming from 1.5s on.
    await vi.advanceTimersByTimeAsync(500);
    for (let t = 1500; t < 4000; t += 500) {
      autosave.edited();
      await vi.advanceTimersByTimeAsync(500);
    }
    await net.pending[0]?.answer(saved(2));
    for (let t = 4000; t < 6500; t += 500) {
      autosave.edited();
      await vi.advanceTimersByTimeAsync(500);
    }
    // 6.5s: 5 seconds after the edit at 1.5s.
    expect(net.fetch).toHaveBeenCalledTimes(2);
    expect(net.pending[1]?.body.revision).toBe(2);
  });

  // Scenario "Offline".
  it("keeps trying while the network is down, then saves", async () => {
    autosave.edited();
    await vi.advanceTimersByTimeAsync(1000);
    await net.pending[0]?.answer(new TypeError("Failed to fetch"));
    expect(states.at(-1)).toBe("failed");
    // More edits wait for the retry, which sends the newest content.
    content = { ...seedSong, sections: seedSong.sections.slice(0, 1) };
    autosave.edited();
    await vi.advanceTimersByTimeAsync(2000);
    expect(net.fetch).toHaveBeenCalledTimes(2);
    await net.pending[1]?.answer(new TypeError("Failed to fetch"));
    // The wait doubles.
    await vi.advanceTimersByTimeAsync(3999);
    expect(net.fetch).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(net.pending[2]?.body.content).toEqual(content);
    await net.pending[2]?.answer(saved(2));
    expect(states.at(-1)).toBe("saved");
  });

  it("retries after a server error", async () => {
    autosave.edited();
    await vi.advanceTimersByTimeAsync(1000);
    await net.pending[0]?.answer(new Response(null, { status: 503 }));
    expect(states.at(-1)).toBe("failed");
    await vi.advanceTimersByTimeAsync(2000);
    expect(net.fetch).toHaveBeenCalledTimes(2);
  });

  it("doesn't save while there is nothing valid to save", async () => {
    content = null;
    autosave.edited();
    await vi.advanceTimersByTimeAsync(1000);
    expect(net.fetch).not.toHaveBeenCalled();
    expect(states.at(-1)).toBe("failed");
    content = seedSong;
    await vi.advanceTimersByTimeAsync(2000);
    expect(net.fetch).toHaveBeenCalledTimes(1);
  });

  // Scenario "Reload after renaming" (sheet-page).
  it("sends the title and the artist as they are now", async () => {
    details = { title: "Grace", artist: "Chris Tomlin" };
    autosave.edited();
    await vi.advanceTimersByTimeAsync(1000);
    expect(net.pending[0]?.body).toEqual({
      ...sheet,
      title: "Grace",
      artist: "Chris Tomlin",
    });
  });

  it("leaves out a removed artist", async () => {
    details = { title: "Grace", artist: undefined };
    autosave.edited();
    await vi.advanceTimersByTimeAsync(1000);
    expect(net.pending[0]?.body).not.toHaveProperty("artist");
  });

  // Scenario "Two tabs" (sheet-page).
  it("stops for good when the sheet was saved elsewhere", async () => {
    autosave.edited();
    await vi.advanceTimersByTimeAsync(1000);
    await net.pending[0]?.answer(new Response(null, { status: 409 }));
    expect(states.at(-1)).toBe("conflict");
    autosave.edited();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(net.fetch).toHaveBeenCalledTimes(1);
    expect(states.at(-1)).toBe("conflict");
  });

  // Scenario "Deleted in another tab" (sheet-page).
  it("stops for good when the sheet was deleted elsewhere", async () => {
    autosave.edited();
    await vi.advanceTimersByTimeAsync(1000);
    await net.pending[0]?.answer(new Response(null, { status: 404 }));
    expect(states.at(-1)).toBe("deleted");
    autosave.edited();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(net.fetch).toHaveBeenCalledTimes(1);
    expect(states.at(-1)).toBe("deleted");
  });

  it("sends nothing once stopped while waiting", async () => {
    autosave.edited();
    autosave.stop();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(net.fetch).not.toHaveBeenCalled();
    autosave.edited();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(net.fetch).not.toHaveBeenCalled();
    expect(states).toEqual(["waiting"]);
  });

  it("ignores a save that fails after the stop", async () => {
    autosave.edited();
    await vi.advanceTimersByTimeAsync(1000);
    autosave.stop();
    await net.pending[0]?.answer(new TypeError("Failed to fetch"));
    await vi.advanceTimersByTimeAsync(60_000);
    expect(net.fetch).toHaveBeenCalledTimes(1);
    expect(states).toEqual(["waiting", "saving"]);
  });
});
