import { readPhotoAnswer } from "chordsheet";
import { afterEach, describe, expect, it, vi } from "vitest";

import { seedSong } from "../editor/seed-song";
import { fakePhotoModel } from "./fake-photo-model.server";

describe("fake photo model", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("answers with Amazing Grace, its sections and chords", async () => {
    const answer = await fakePhotoModel()([], new AbortController().signal);
    expect(readPhotoAnswer(answer)).toEqual({
      title: "Amazing Grace",
      content: seedSong,
    });
  });

  it("waits before answering", async () => {
    vi.useFakeTimers();
    let answered = false;
    const answer = fakePhotoModel(120)([], new AbortController().signal).then(
      () => (answered = true),
    );
    await vi.advanceTimersByTimeAsync(119_000);
    expect(answered).toBe(false);
    await vi.advanceTimersByTimeAsync(1_000);
    await answer;
    expect(answered).toBe(true);
  });

  it("stops waiting when the signal aborts", async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const answer = fakePhotoModel(120)([], controller.signal);
    controller.abort();
    await expect(answer).rejects.toThrow(/abort/i);
    expect(vi.getTimerCount()).toBe(0);
  });
});
