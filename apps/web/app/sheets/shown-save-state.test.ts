import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SaveState } from "./autosave";
import { SaveStateDisplay, type ShownSaveState } from "./shown-save-state";

describe("shown save state", () => {
  let shown: ShownSaveState[];
  let display: SaveStateDisplay;

  beforeEach(() => {
    vi.useFakeTimers();
    shown = [];
    display = new SaveStateDisplay({ onShown: (s) => shown.push(s) });
  });
  afterEach(() => {
    display.cancel();
    vi.useRealTimers();
  });

  const go = async (state: SaveState, ms = 0) => {
    display.update(state);
    await vi.advanceTimersByTimeAsync(ms);
  };

  it("starts out saved", async () => {
    await go("saved", 5000);
    expect(shown).toEqual([]);
  });

  // Scenario "Typing".
  it("says nothing while edits wait, and Saved once it lasts", async () => {
    await go("waiting", 1000);
    expect(shown).toEqual([null]);
    await go("saving", 100);
    await go("saved", 999);
    expect(shown).toEqual([null]);
    await vi.advanceTimersByTimeAsync(1);
    expect(shown).toEqual([null, "saved"]);
  });

  it("doesn't say Saved between two saves while typing", async () => {
    await go("waiting", 5000);
    await go("saving", 100);
    await go("saved", 300);
    await go("waiting", 4600);
    await go("saving", 100);
    await go("waiting", 5000);
    expect(shown).toEqual([null]);
  });

  // Scenario "Slow save".
  it("says Saving… once a save lasts", async () => {
    await go("waiting", 1000);
    await go("saving", 499);
    expect(shown).toEqual([null]);
    await vi.advanceTimersByTimeAsync(2501);
    expect(shown).toEqual([null, "saving"]);
    await go("saved", 1000);
    expect(shown).toEqual([null, "saving", null, "saved"]);
  });

  // Scenario "Offline".
  it("says at once when a save failed, and keeps it during the retry", async () => {
    await go("waiting", 1000);
    await go("saving", 100);
    await go("failed");
    expect(shown).toEqual([null, "failed"]);
    await go("saving", 100);
    await go("failed", 2000);
    expect(shown).toEqual([null, "failed"]);
    await go("saving", 600);
    expect(shown).toEqual([null, "failed", "saving"]);
  });

  it("says at once when saving stopped for good", async () => {
    await go("waiting", 1000);
    await go("saving", 100);
    await go("conflict");
    expect(shown).toEqual([null, "conflict"]);
    display = new SaveStateDisplay({ onShown: (s) => shown.push(s) });
    await go("deleted");
    expect(shown.at(-1)).toBe("deleted");
  });
});
