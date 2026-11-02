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
  let net: ReturnType<typeof fakeFetch>;
  let autosave: Autosave;

  beforeEach(() => {
    vi.useFakeTimers();
    states = [];
    content = seedSong;
    net = fakeFetch();
    autosave = new Autosave({
      sheet,
      read: () => content,
      onState: (state) => states.push(state),
      fetch: net.fetch as unknown as typeof fetch,
    });
  });
  afterEach(() => {
    autosave.dispose();
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
    await vi.advanceTimersByTimeAsync(5000);
    expect(net.fetch).toHaveBeenCalledTimes(1);
    await net.pending[0]?.answer(saved(2));
    expect(states.at(-1)).toBe("waiting");
    await vi.advanceTimersByTimeAsync(1000);
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
});
