import type { ShouldRevalidateFunctionArgs } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { NAME_TAKEN } from "./collections-client";
import {
  collectionsState,
  isSheetCollectionsPath,
  loadSheetCollections,
  revalidateUnlessCollectionChange,
  submitNewCollection,
  submitTick,
} from "./sheet-collections";

const christmas = { id: "c1", name: "Christmas", holds: true };
const campfire = { id: "c2", name: "Campfire", holds: false };

function answering(response: Response | Error) {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      response instanceof Error
        ? Promise.reject(response)
        : Promise.resolve(response),
    ),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

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

describe("the routes' client answers", () => {
  it("loads the list, or answers that it failed", async () => {
    answering(Response.json([christmas]));
    expect(await loadSheetCollections("s1")).toEqual({
      ok: true,
      collections: [christmas],
    });
    answering(new TypeError("Failed to fetch"));
    expect(await loadSheetCollections("s1")).toEqual({ ok: false });
  });

  it("ticks, or answers that the change didn't get through", async () => {
    const put = () =>
      new Request("http://localhost/api/sheets/s1/collections/c1", {
        method: "PUT",
      });
    answering(new Response(null, { status: 204 }));
    expect(await submitTick("s1", "c1", put())).toEqual({ ok: true });
    answering(new TypeError("Failed to fetch"));
    expect(await submitTick("s1", "c1", put())).toEqual({ ok: false });
  });

  it("makes a collection, or says why not", async () => {
    const post = () => {
      const body = new FormData();
      body.set("name", "Christmas");
      return new Request("http://localhost/api/sheets/s1/collections", {
        method: "POST",
        body,
      });
    };
    answering(Response.json({ id: "c1", name: "Christmas" }, { status: 201 }));
    expect(await submitNewCollection("s1", post())).toEqual({ ok: true });
    answering(new Response(null, { status: 409 }));
    expect(await submitNewCollection("s1", post())).toEqual({
      ok: false,
      refused: NAME_TAKEN,
    });
    answering(new TypeError("Failed to fetch"));
    expect(await submitNewCollection("s1", post())).toEqual({ ok: false });
  });
});
