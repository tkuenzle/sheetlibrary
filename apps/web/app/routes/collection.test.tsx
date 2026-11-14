import { renderToString } from "react-dom/server";
import { createRoutesStub, RouterContextProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { AddSheetsDialog, addLabel } from "../collections/add-sheets-dialog";
import {
  addSheets,
  type Collection,
  createCollection,
  readCollection,
} from "../collections/collections.server";
import { cloudflareContext, sessionContext } from "../context";
import { testEnv } from "../db/local-env.test-helper";
import { seedSong } from "../editor/seed-song";
import { createSheet } from "../sheets/sheets.server";
import { addUser } from "../sheets/sheets.test-helper";
import type { Route } from "./+types/collection";
import { action, CollectionView, loader, meta } from "./collection";

describe("collection loader and action", () => {
  let test: Awaited<ReturnType<typeof testEnv>>;
  let db: D1Database;
  let christmas: string;
  let stille: string;
  let drue: string;
  beforeEach(async () => {
    test = await testEnv();
    db = test.env.DB;
    await addUser(db, "ana");
    await addUser(db, "bo");
    const made = await createCollection(db, "ana", { name: "Christmas" });
    if (made.kind !== "saved") throw new Error(made.kind);
    christmas = made.collection.id;
    ({ id: stille } = await createSheet(db, "ana", {
      title: "Stille Nacht",
      content: seedSong,
    }));
    ({ id: drue } = await createSheet(db, "ana", {
      title: "Drüü Könige",
      artist: "Trad.",
      content: seedSong,
    }));
  });
  afterEach(() => test.dispose());

  function context(userId: string | null) {
    const context = new RouterContextProvider();
    context.set(cloudflareContext, { env: test.env });
    const session = { user: { id: userId }, session: {} } as never;
    context.set(sessionContext, userId ? session : null);
    return context;
  }

  const load = (userId: string | null, id = christmas) =>
    loader({
      context: context(userId),
      params: { id },
    } as unknown as Route.LoaderArgs);

  function post(userId: string | null, fields: [string, string][]) {
    const body = new FormData();
    for (const [name, value] of fields) body.append(name, value);
    const request = new Request(
      `https://sheetlibrary.com/collections/${christmas}`,
      { method: "POST", body },
    );
    return action({
      context: context(userId),
      params: { id: christmas },
      request,
    } as unknown as Route.ActionArgs);
  }

  // Scenario "A to Z".
  it("gives the collection with its sheets, A to Z", async () => {
    await addSheets(db, "ana", christmas, [stille, drue]);
    expect(await load("ana")).toEqual({
      collection: {
        id: christmas,
        name: "Christmas",
        sheets: [
          { id: drue, title: "Drüü Könige", artist: "Trad." },
          { id: stille, title: "Stille Nacht" },
        ],
      },
    });
  });

  // Scenario "Someone else's collection".
  it("answers 404 for someone else's collection", async () => {
    const result = (await load("bo")) as unknown as {
      data: unknown;
      init: { status: number };
    };
    expect(result.data).toEqual({ collection: null });
    expect(result.init.status).toBe(404);
  });

  it("sends visitors who aren't signed in to sign-in", async () => {
    const response = (await load(null)) as Response;
    expect(response.headers.get("Location")).toBe("/sign-in");
    const posted = (await post(null, [["intent", "add"]])) as Response;
    expect(posted.headers.get("Location")).toBe("/sign-in");
  });

  it("adds the ticked sheets and takes one out", async () => {
    expect(
      await post("ana", [
        ["intent", "add"],
        ["sheetId", stille],
        ["sheetId", drue],
      ]),
    ).toEqual({ ok: true });
    expect(
      await post("ana", [
        ["intent", "remove"],
        ["sheetId", stille],
      ]),
    ).toEqual({ ok: true });
    expect((await readCollection(db, "ana", christmas))?.sheets).toEqual([
      { id: drue, title: "Drüü Könige", artist: "Trad." },
    ]);
  });

  it("refuses someone else's collection and an unknown intent", async () => {
    const theirs = (await post("bo", [
      ["intent", "add"],
      ["sheetId", stille],
    ])) as unknown as { init: { status: number } };
    expect(theirs.init.status).toBe(404);
    const unknown = (await post("ana", [["intent", "rename"]])) as unknown as {
      init: { status: number };
    };
    expect(unknown.init.status).toBe(400);
    expect((await readCollection(db, "ana", christmas))?.sheets).toEqual([]);
  });
});

const christmas: Collection = {
  id: "abcdefghijkl",
  name: "Christmas",
  sheets: [
    { id: "drue00000000", title: "Drüü Könige", artist: "Trad." },
    { id: "stille000000", title: "Stille Nacht" },
  ],
};

function render(collection: Collection) {
  const Stub = createRoutesStub([
    {
      path: "/collections/:id",
      Component: () => (
        <CollectionView
          collection={collection}
          onRenamed={() => Promise.resolve()}
          onDeleted={() => undefined}
        />
      ),
    },
  ]);
  return renderToString(
    <Stub initialEntries={[`/collections/${collection.id}`]} />,
  );
}

describe("collection page", () => {
  it("shows the name, the count and the sheets, each opening to play", () => {
    const html = render(christmas);
    expect(html).toMatch(/<h1[^>]*>Christmas<\/h1><p>2 sheets<\/p>/);
    expect(html).toMatch(
      /<a class="collection-columns" [^>]*href="\/sheets\/drue00000000"[^>]*>.*Drüü Könige.*Trad\./,
    );
    expect(html.indexOf("Drüü Könige")).toBeLessThan(
      html.indexOf("Stille Nacht"),
    );
    expect(html).toContain("Add sheets");
  });

  // Requirement "Removing a sheet".
  it("has a remove button on each row, named for the sheet and the collection", () => {
    const html = render(christmas);
    expect(html).toContain('aria-label="Remove Stille Nacht from Christmas"');
    expect(html).toMatch(
      /<form [^>]*action="\/collections\/abcdefghijkl" method="post"><input type="hidden" name="intent" value="remove"\/><input type="hidden" name="sheetId" value="stille000000"\/>/,
    );
  });

  // Requirement "The collection's menu".
  it("has a menu beside the name", () => {
    expect(render(christmas)).toContain(
      'aria-label="More for this collection"',
    );
  });

  // Scenario "A new collection".
  it("says an empty collection has no sheets, and offers Add sheets", () => {
    const html = render({ ...christmas, sheets: [] });
    expect(html).toMatch(/<p>No sheets yet<\/p>/);
    expect(html).toMatch(/No sheets in this collection.*Add sheets/s);
    expect(html).not.toContain("group-list");
    expect(html).not.toContain("library-actions-docked");
  });

  it("names the page for the collection, and asks not to be indexed", () => {
    const named = meta({
      loaderData: { collection: christmas },
    } as unknown as Route.MetaArgs);
    expect(named).toContainEqual({ title: "Christmas | Sheet Library" });
    expect(named).toContainEqual({ name: "robots", content: "noindex" });
    expect(
      meta({ loaderData: { collection: null } } as unknown as Route.MetaArgs),
    ).toContainEqual({ title: "Collection not found | Sheet Library" });
  });
});

describe("Add sheets", () => {
  it("counts the ticked sheets on its button", () => {
    expect(addLabel(0)).toBe("Add sheets");
    expect(addLabel(1)).toBe("Add 1 sheet");
    expect(addLabel(2)).toBe("Add 2 sheets");
  });

  it("asks which sheets to add to the collection, with a search", () => {
    const Stub = createRoutesStub([
      {
        path: "/",
        Component: () => (
          <AddSheetsDialog
            open
            collection={christmas}
            holds={new Set(["stille000000"])}
            onClose={() => undefined}
          />
        ),
      },
    ]);
    const html = renderToString(<Stub />);
    expect(html).toContain("Add sheets to “Christmas”");
    expect(html).toMatch(/<input type="search" aria-label="Search sheets"/);
    expect(html).toMatch(
      /type="button"[^>]*>Cancel<\/button><button type="submit"[^>]*disabled=""[^>]*>Add sheets<\/button>/,
    );
  });
});
