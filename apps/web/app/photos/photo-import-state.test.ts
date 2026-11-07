import { describe, expect, it } from "vitest";

import {
  canAdd,
  canImport,
  elapsed,
  initialState,
  type PhotoImportAction,
  photoImportReducer,
  type PhotoImportState,
  photos,
} from "./photo-import-state";

function run(...actions: PhotoImportAction[]): PhotoImportState {
  return actions.reduce(photoImportReducer, initialState);
}

const photo = (name: string) => new Blob([name], { type: "image/jpeg" });

// Adds the pages and shrinks each.
function ready(...names: string[]): PhotoImportAction[] {
  return [
    { type: "add", ids: names.map((_, at) => at + 1) },
    ...names.map((name, at): PhotoImportAction => ({
      type: "shrunk",
      id: at + 1,
      photo: photo(name),
      thumbnail: `blob:${name}`,
    })),
  ];
}

describe("photo import state", () => {
  it("starts with no pages and Import disabled", () => {
    expect(initialState.pages).toEqual([]);
    expect(canAdd(initialState)).toBe(true);
    expect(canImport(initialState)).toBe(false);
  });

  it("waits for each photo to be shrunk", () => {
    const state = run({ type: "add", ids: [1, 2] });
    expect(state.pages.map((page) => page.status)).toEqual([
      "shrinking",
      "shrinking",
    ]);
    expect(canImport(state)).toBe(false);
    expect(canImport(run(...ready("one", "two")))).toBe(true);
  });

  // Scenario "Removing a page".
  it("keeps the pages in the order they were added, without a removed one", async () => {
    const state = run(...ready("one", "two", "three"), {
      type: "remove",
      id: 2,
    });
    expect(state.pages.map((page) => page.id)).toEqual([1, 3]);
    expect(await Promise.all(photos(state).map((p) => p.text()))).toEqual([
      "one",
      "three",
    ]);
  });

  // Scenario "Ten pages".
  it("adds up to 10 pages, leaving out the rest", () => {
    const nine = run({ type: "add", ids: [1, 2, 3, 4, 5, 6, 7, 8, 9] });
    expect(canAdd(nine)).toBe(true);
    const ten = photoImportReducer(nine, { type: "add", ids: [10, 11, 12] });
    expect(ten.pages.map((page) => page.id)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
    expect(canAdd(ten)).toBe(false);
    expect(photoImportReducer(ten, { type: "add", ids: [13] })).toBe(ten);
  });

  // Scenario "A HEIC photo on a desktop".
  it("waits until a photo that can't be opened is removed", () => {
    const state = run(...ready("one", "two"), { type: "unopenable", id: 2 });
    expect(state.pages[1]).toEqual({ id: 2, status: "unopenable" });
    expect(canImport(state)).toBe(false);
    expect(
      canImport(photoImportReducer(state, { type: "remove", id: 2 })),
    ).toBe(true);
  });

  // Scenario "A slow reading".
  it("shows the upload in percent, then the reading with its time", () => {
    const uploading = run(...ready("one"), { type: "start" });
    expect(uploading.stage).toEqual({ kind: "uploading", percent: 0 });
    const half = photoImportReducer(uploading, { type: "progress", sent: 0.6 });
    expect(half.stage).toEqual({ kind: "uploading", percent: 60 });
    const reading = photoImportReducer(half, { type: "sent", at: 1000 });
    expect(reading.stage).toEqual({ kind: "reading", since: 1000 });
    expect(elapsed(1000, 43_000)).toBe("0:42");
    expect(elapsed(1000, 126_000)).toBe("2:05");
  });

  it("doesn't change the pages while they are sent or read", () => {
    const uploading = run(...ready("one", "two"), { type: "start" });
    expect(canAdd(uploading)).toBe(false);
    expect(canImport(uploading)).toBe(false);
    expect(photoImportReducer(uploading, { type: "remove", id: 1 })).toBe(
      uploading,
    );
    const reading = photoImportReducer(uploading, { type: "sent", at: 0 });
    expect(photoImportReducer(reading, { type: "add", ids: [3] })).toBe(
      reading,
    );
  });

  it("doesn't start without pages", () => {
    expect(run({ type: "start" })).toBe(initialState);
  });

  // Scenario "Trying again".
  it("keeps the pages when the reading fails, and can start again", () => {
    const failed = run(
      ...ready("one", "two"),
      { type: "start" },
      { type: "sent", at: 0 },
      { type: "failed" },
    );
    expect(failed.stage).toEqual({ kind: "failed" });
    expect(failed.pages).toHaveLength(2);
    expect(canAdd(failed)).toBe(true);
    expect(canImport(failed)).toBe(true);
    expect(photoImportReducer(failed, { type: "start" }).stage).toEqual({
      kind: "uploading",
      percent: 0,
    });
  });
});
