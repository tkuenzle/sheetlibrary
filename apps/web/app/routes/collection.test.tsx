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
import type { SheetOrder } from "../sheets/order";
import { addUser } from "../sheets/sheets.test-helper";
import type { Route } from "./+types/collection";
import {
  action,
  clientAction,
  CollectionSkeleton,
  CollectionView,
  loader,
  meta,
} from "./collection";

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

  const load = (userId: string | null, id = christmas, cookie?: string) =>
    loader({
      context: context(userId),
      params: { id },
      request: new Request(`https://sheetlibrary.com/collections/${id}`, {
        headers: cookie ? { Cookie: cookie } : {},
      }),
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
    expect(await load("ana")).toMatchObject({
      collection: {
        id: christmas,
        name: "Christmas",
        sheets: [
          { id: drue, title: "Drüü Könige", artist: "Trad." },
          { id: stille, title: "Stille Nacht" },
        ],
      },
      order: "title",
    });
  });

  // Scenario "From Sheets to a collection".
  it("gives the order this device keeps", async () => {
    expect(await load("ana", christmas, "sheet-order=added")).toMatchObject({
      order: "added",
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
    ).toEqual({ ok: true, intent: "remove" });
    expect((await readCollection(db, "ana", christmas))?.sheets).toMatchObject([
      { id: drue, title: "Drüü Könige", artist: "Trad." },
    ]);
  });

  // Scenario "Deleting a sheet" from a row in a collection: the sheet goes
  // from the library and from the collection.
  it("deletes a sheet from its row", async () => {
    await addSheets(db, "ana", christmas, [stille, drue]);
    expect(
      await post("ana", [
        ["intent", "delete"],
        ["sheetId", stille],
      ]),
    ).toEqual({ ok: true, intent: "delete" });
    expect((await readCollection(db, "ana", christmas))?.sheets).toMatchObject([
      { id: drue },
    ]);
    const theirs = (await post("bo", [
      ["intent", "delete"],
      ["sheetId", drue],
    ])) as unknown as { init: { status: number } };
    expect(theirs.init.status).toBe(404);
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
    {
      id: "drue00000000",
      title: "Drüü Könige",
      artist: "Trad.",
      key: "A",
      updatedAt: Date.UTC(2025, 8, 3),
      addedAt: Date.UTC(2025, 8, 1),
    },
    {
      id: "stille000000",
      title: "Stille Nacht",
      updatedAt: Date.UTC(2025, 8, 2),
      addedAt: Date.UTC(2025, 8, 4),
    },
  ],
};

function render(collection: Collection, order?: SheetOrder) {
  const Stub = createRoutesStub([
    {
      path: "/collections/:id",
      Component: () => (
        <CollectionView
          collection={collection}
          order={order}
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
      /<a class="library-columns" [^>]*href="\/sheets\/drue00000000"[^>]*>.*Drüü Könige.*Trad\..*<span aria-hidden="true">A<\/span>/,
    );
    expect(html.indexOf("Drüü Könige")).toBeLessThan(
      html.indexOf("Stille Nacht"),
    );
    expect(html).toContain("Add sheets");
  });

  // Requirement "Add buttons beside the heading": tonal, at every width,
  // and never floating. The floating button is the shell's "New sheet".
  it("has Add sheets beside the heading, and no floating button", () => {
    const html = render(christmas);
    expect(html).toMatch(
      /library-actions-beside"><button type="button" class="button button-tonal"><svg [^>]*>.*?<\/svg>Add sheets<\/button>/,
    );
    expect(html).not.toContain("floating-button");
  });

  // Requirement "Removing a sheet": in the row's menu, not a button.
  it("has the shared row menu on each row, without a remove button", () => {
    const html = render(christmas);
    expect(html).toContain('aria-label="More for Stille Nacht"');
    expect(html).not.toContain("Remove Stille Nacht from Christmas");
    expect(html).not.toContain('name="intent"');
  });

  // Scenario "From Sheets to a collection".
  it("lists the sheets in the order this device keeps", () => {
    const html = render(christmas, "added");
    expect(html.indexOf("Stille Nacht")).toBeLessThan(
      html.indexOf("Drüü Könige"),
    );
    expect(html).toMatch(/Last added<svg/);
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
    expect(html).toMatch(
      /No sheets in this collection.*<button type="button" class="button button-filled">.*Add sheets/s,
    );
    expect(html).not.toContain("floating-button");
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

  // On a move inside the app the sheets are still on their way, so the
  // name comes from the rail.
  it("names the page from the rail while its sheets load", () => {
    const named = meta({
      loaderData: { page: new Promise(() => undefined) },
      params: { id: "xmas00000000" },
      matches: [
        undefined,
        {
          id: "routes/shell",
          loaderData: {
            collections: [
              { id: "xmas00000000", name: "Christmas", count: 2, titles: [] },
            ],
          },
        },
      ],
    } as unknown as Route.MetaArgs);
    expect(named).toContainEqual({ title: "Christmas | Sheet Library" });
  });
});

function renderSkeleton(
  listed?: Parameters<typeof CollectionSkeleton>[0]["listed"],
) {
  const Stub = createRoutesStub([
    {
      path: "/collections/:id",
      Component: () => <CollectionSkeleton listed={listed} />,
    },
  ]);
  return renderToString(<Stub initialEntries={["/collections/xmas"]} />);
}

const skeletonRows = (html: string) =>
  html.match(/class="library-columns sheet-list-skeleton"/g)?.length ?? 0;

// Requirement "What the skeleton already knows".
describe("collection page while its sheets load", () => {
  it("shows the name and count from the rail, and a row of bars per sheet", () => {
    const html = renderSkeleton({ name: "Christmas", count: 3 });
    expect(html).toMatch(/<h1[^>]*>Christmas<\/h1><p>3 sheets<\/p>/);
    expect(skeletonRows(html)).toBe(3);
    expect(html).toContain('aria-busy="true"');
  });

  it("shows a screenful of rows at most", () => {
    expect(skeletonRows(renderSkeleton({ name: "Campfire", count: 21 }))).toBe(
      8,
    );
  });

  it("has no rows for an empty collection", () => {
    const html = renderSkeleton({ name: "Learning", count: 0 });
    expect(html).toMatch(/<p>No sheets yet<\/p>/);
    expect(skeletonRows(html)).toBe(0);
  });

  it("shows bars for the name and count without the rail's entry", () => {
    const html = renderSkeleton();
    expect(html).toMatch(/<h1[^>]*><span class="skeleton-bar"/);
    expect(skeletonRows(html)).toBe(8);
  });

  it("lets the buttons wait for the sheets", () => {
    const html = renderSkeleton({ name: "Christmas", count: 3 });
    expect(html).toMatch(
      /<button[^>]*disabled=""[^>]*>.*?Add sheets<\/button>/,
    );
    expect(html).toMatch(
      /<button[^>]*aria-label="More for this collection"[^>]*disabled=""|<button[^>]*disabled=""[^>]*aria-label="More for this collection"/,
    );
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

  // Requirement "Bars in the dialogs that load": rows of bars until the
  // list is there, and "Add sheets" waits.
  it("shows rows of bars while the sheets load", () => {
    const Stub = createRoutesStub([
      {
        path: "/",
        Component: () => (
          <AddSheetsDialog
            open
            collection={christmas}
            holds={new Set()}
            onClose={() => undefined}
          />
        ),
      },
    ]);
    const html = renderToString(<Stub />);
    expect(html.match(/class="add-sheets-skeleton"/g)).toHaveLength(6);
    expect(html).toContain("skeleton-bar skeleton-bar-box");
    expect(html).toMatch(
      /<button type="submit"[^>]*disabled=""[^>]*>Add sheets/,
    );
  });
});

// Scenario "Deleting offline": the list stays, and the row comes back.
describe("a row's change that doesn't get through", () => {
  it("answers { ok: false } rather than failing the page", async () => {
    const body = new FormData();
    body.append("intent", "remove");
    body.append("sheetId", "stille000000");
    const answer = await clientAction({
      request: new Request(
        "https://sheetlibrary.com/collections/abcdefghijkl",
        {
          method: "POST",
          body,
        },
      ),
      serverAction: () => Promise.reject(new TypeError("Failed to fetch")),
    } as unknown as Parameters<typeof clientAction>[0]);
    expect(answer).toEqual({ ok: false, intent: "remove" });
  });
});
