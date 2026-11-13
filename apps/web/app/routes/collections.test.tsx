import { renderToString } from "react-dom/server";
import { createRoutesStub, RouterContextProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { CollectionListItem } from "../collections/collections";
import { addSheets, createCollection } from "../collections/collections.server";
import { cloudflareContext, sessionContext } from "../context";
import { testEnv } from "../db/local-env.test-helper";
import { seedSong } from "../editor/seed-song";
import { createSheet } from "../sheets/sheets.server";
import { addUser } from "../sheets/sheets.test-helper";
import type { Route } from "./+types/collections";
import { CollectionsView, loader, meta } from "./collections";

describe("collections loader", () => {
  let test: Awaited<ReturnType<typeof testEnv>>;
  beforeEach(async () => {
    test = await testEnv();
    await addUser(test.env.DB, "ana");
    await addUser(test.env.DB, "bo");
  });
  afterEach(() => test.dispose());

  function load(userId: string | null) {
    const context = new RouterContextProvider();
    context.set(cloudflareContext, { env: test.env });
    const session = { user: { id: userId }, session: {} } as never;
    context.set(sessionContext, userId ? session : null);
    return loader({ context } as unknown as Route.LoaderArgs);
  }

  // Scenario "A to Z".
  it("gives the person their collections, A to Z, with their counts", async () => {
    const db = test.env.DB;
    const kinder = await createCollection(db, "ana", { name: "Kinderlieder" });
    await createCollection(db, "ana", { name: "Christmas" });
    await createCollection(db, "bo", { name: "Shanties" });
    const { id } = await createSheet(db, "ana", {
      title: "Alle meine Entchen",
      content: seedSong,
    });
    if (kinder.kind !== "saved") throw new Error(kinder.kind);
    await addSheets(db, "ana", kinder.collection.id, [id]);
    const data = (await load("ana")) as { collections: CollectionListItem[] };
    expect(data.collections.map((c) => [c.name, c.count])).toEqual([
      ["Christmas", 0],
      ["Kinderlieder", 1],
    ]);
  });

  // Scenario "Not signed in".
  it("sends visitors who aren't signed in to sign-in", async () => {
    const response = (await load(null)) as Response;
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/sign-in");
  });
});

function render(collections: CollectionListItem[]) {
  const Stub = createRoutesStub([
    {
      path: "/collections",
      Component: () => (
        <CollectionsView
          collections={collections}
          onCreated={() => undefined}
        />
      ),
    },
  ]);
  return renderToString(<Stub initialEntries={["/collections"]} />);
}

describe("Collections tab", () => {
  it("lists each collection with its count, linking to its page", () => {
    const html = render([
      { id: "abcdefghijkl", name: "Christmas", count: 14 },
      { id: "mnopqrstuvwx", name: "Learning", count: 1 },
    ]);
    expect(html).toMatch(
      /<a href="\/collections\/abcdefghijkl">.*Christmas.*14 sheets/,
    );
    expect(html).toMatch(/<a href="\/collections\/mnopqrstuvwx">.*1 sheet</);
    expect(html.indexOf("Christmas")).toBeLessThan(html.indexOf("Learning"));
  });

  // Scenario "Switching tabs".
  it("marks Collections, offers New collection and has no search", () => {
    const html = render([{ id: "abcdefghijkl", name: "Christmas", count: 0 }]);
    expect(html).toContain(
      '<a href="/sheets">Sheets</a><a href="/collections" aria-current="page">Collections</a>',
    );
    expect(html).toContain("New collection");
    expect(html).not.toContain('role="search"');
    expect(html).not.toContain("New sheet");
  });

  // Scenario "First visit".
  it("says there are no collections yet, and offers New collection", () => {
    const html = render([]);
    expect(html).toContain("No collections yet");
    expect(html).toMatch(/No collections yet.*New collection/s);
    expect(html).not.toContain("collections-list");
  });

  it("sets the page title and asks search engines not to index it", () => {
    expect(meta()).toContainEqual({ title: "Collections | Sheet Library" });
    expect(meta()).toContainEqual({ name: "robots", content: "noindex" });
  });
});
