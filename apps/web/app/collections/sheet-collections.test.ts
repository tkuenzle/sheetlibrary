import type { ShouldRevalidateFunctionArgs } from "react-router";
import { describe, expect, it } from "vitest";

import {
  collectionsState,
  isSheetCollectionsPath,
  loadSheetCollections,
  revalidateUnlessCollectionChange,
} from "./sheet-collections";

const christmas = { id: "c1", name: "Christmas", holds: true };
const campfire = { id: "c2", name: "Campfire", holds: false };

describe("collectionsState", () => {
  it("answers what the page knows until the fetcher has loaded", () => {
    expect(collectionsState(undefined, [christmas])).toEqual({
      kind: "loaded",
      collections: [christmas],
    });
  });

  it("answers the loaded list over what the page knew", () => {
    expect(
      collectionsState({ ok: true, collections: [campfire] }, [christmas]),
    ).toEqual({ kind: "loaded", collections: [campfire] });
  });

  it("is loading with nothing known, and failed when the load failed", () => {
    expect(collectionsState(undefined)).toEqual({ kind: "loading" });
    expect(collectionsState({ ok: false })).toEqual({ kind: "failed" });
  });

  it("keeps what the page knows when a later load fails", () => {
    expect(collectionsState({ ok: false }, [christmas])).toEqual({
      kind: "loaded",
      collections: [christmas],
    });
  });
});

describe("isSheetCollectionsPath", () => {
  it("knows a sheet's collections routes", () => {
    expect(isSheetCollectionsPath("/api/sheets/s1/collections")).toBe(true);
    expect(isSheetCollectionsPath("/api/sheets/s1/collections/c1")).toBe(true);
    expect(isSheetCollectionsPath("/api/sheets/s1")).toBe(false);
    expect(isSheetCollectionsPath("/api/collections/c1")).toBe(false);
    expect(isSheetCollectionsPath(undefined)).toBe(false);
  });
});

describe("revalidateUnlessCollectionChange", () => {
  const args = (formAction?: string) =>
    ({
      formAction,
      defaultShouldRevalidate: true,
    }) as ShouldRevalidateFunctionArgs;

  it("skips the page after a change to the sheet's collections", () => {
    expect(
      revalidateUnlessCollectionChange(args("/api/sheets/s1/collections/c1")),
    ).toBe(false);
  });

  it("loads again as React Router would otherwise", () => {
    expect(revalidateUnlessCollectionChange(args())).toBe(true);
    expect(revalidateUnlessCollectionChange(args("/sheets/s1"))).toBe(true);
  });
});

describe("loadSheetCollections", () => {
  it("loads the list, or answers that it failed", async () => {
    expect(
      await loadSheetCollections(() => Promise.resolve([christmas])),
    ).toEqual({
      ok: true,
      collections: [christmas],
    });
    expect(
      await loadSheetCollections(() =>
        Promise.resolve({ error: "Sheet not found" }),
      ),
    ).toEqual({ ok: false });
    expect(
      await loadSheetCollections(() =>
        Promise.reject(new TypeError("Failed to fetch")),
      ),
    ).toEqual({ ok: false });
  });
});
