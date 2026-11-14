import { renderToString } from "react-dom/server";
import {
  createRoutesStub,
  RouterContextProvider,
  type ShouldRevalidateFunctionArgs,
} from "react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { CollectionListItem } from "../collections/collections";
import { addSheets, createCollection } from "../collections/collections.server";
import { cloudflareContext, sessionContext } from "../context";
import { testEnv } from "../db/local-env.test-helper";
import { seedSong } from "../editor/seed-song";
import { NotFound } from "../sheets/not-found";
import { createSheet } from "../sheets/sheets.server";
import { addUser } from "../sheets/sheets.test-helper";
import { SignedInContext } from "../shell/signed-in";
import type { Route } from "./+types/shell";
import Shell, { loader, navItems, shouldRevalidate, ShellView } from "./shell";

describe("shell loader", () => {
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

  // Scenarios "A to Z" and "Collections in the rail".
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

describe("shell shouldRevalidate", () => {
  const args = (from: string, to: string, formMethod?: string) =>
    ({
      currentUrl: new URL(from, "https://sheetlibrary.com"),
      nextUrl: new URL(to, "https://sheetlibrary.com"),
      formMethod,
      defaultShouldRevalidate: true,
    }) as ShouldRevalidateFunctionArgs;

  it("doesn't load the collections again for a search", () => {
    expect(shouldRevalidate(args("/sheets", "/sheets?q=gr"))).toBe(false);
    expect(shouldRevalidate(args("/sheets?q=gr", "/sheets?q=grace"))).toBe(
      false,
    );
  });

  it("loads them again after a move, an action and a reload of the data", () => {
    expect(shouldRevalidate(args("/collections", "/sheets?q=gr"))).toBe(true);
    expect(shouldRevalidate(args("/collections/a", "/collections"))).toBe(true);
    expect(shouldRevalidate(args("/collections/a", "/collections/a"))).toBe(
      true,
    );
    expect(shouldRevalidate(args("/sheets", "/sheets?q=gr", "POST"))).toBe(
      true,
    );
  });
});

const collections: CollectionListItem[] = [
  { id: "campfire0000", name: "Campfire", count: 21 },
  { id: "christmas000", name: "Christmas", count: 1 },
];

describe("navItems", () => {
  const marked = (pathname: string) =>
    navItems(pathname, collections).flatMap((item) => [
      ...(item.current ? [item.label] : []),
      ...(item.children ?? [])
        .filter((child) => child.current)
        .map((child) => child.label),
    ]);

  // Scenario "The open screen".
  it("marks the open screen", () => {
    expect(marked("/sheets")).toEqual(["Sheets"]);
    expect(marked("/collections")).toEqual(["Collections"]);
    expect(marked("/account")).toEqual([]);
  });

  it("marks an open collection by its own entry", () => {
    expect(marked("/collections/christmas000")).toEqual(["Christmas"]);
  });

  it("marks Collections for a collection that isn't listed", () => {
    expect(marked("/collections/unknown00000")).toEqual(["Collections"]);
  });

  it("lists each collection with its count, read as sheets", () => {
    const children = navItems("/sheets", collections)[1]?.children;
    expect(children).toEqual([
      {
        href: "/collections/campfire0000",
        label: "Campfire",
        count: { text: "21", label: "21 sheets" },
        current: false,
      },
      {
        href: "/collections/christmas000",
        label: "Christmas",
        count: { text: "1", label: "1 sheet" },
        current: false,
      },
    ]);
  });
});

// The three navigations, in the order they are rendered: the rail, its
// compact form and the bottom bar. CSS shows one of them.
function navs(html: string) {
  return html.match(/<nav .*?<\/nav>/gs) ?? [];
}

function link(html: string, href: string) {
  return new RegExp(`<a [^>]*href="${href}"[^>]*>`).exec(html)?.[0] ?? "";
}

describe("ShellView", () => {
  function render(pathname: string) {
    const Stub = createRoutesStub([
      {
        path: "*",
        Component: () => (
          <ShellView pathname={pathname} collections={collections} initial="A">
            <h1>Screen</h1>
          </ShellView>
        ),
      },
    ]);
    return renderToString(<Stub initialEntries={[pathname]} />);
  }

  // Requirement "Skip to content".
  it("starts with a link that skips to the content", () => {
    const html = render("/sheets");
    expect(html).toMatch(
      /^<div class="shell"><a class="shell-skip" href="#content">Skip to content<\/a><nav /,
    );
    expect(html).toMatch(
      /<main id="content" class="shell-content" tabindex="-1"><h1>Screen<\/h1><\/main>/,
    );
  });

  it("has the navigation as a rail, a compact rail and a bar, then no top bar", () => {
    const html = render("/sheets");
    const [rail, compact, bar] = navs(html);
    expect(navs(html)).toHaveLength(3);
    expect(rail).toMatch(/^<nav class="nav-rail" aria-label="Main">/);
    expect(compact).toMatch(/^<nav class="nav-rail nav-rail-compact"/);
    expect(bar).toMatch(/^<nav class="nav-bar" aria-label="Main">/);
    expect(html).not.toContain("<header");
  });

  // Requirement "Rail on wide screens".
  it("starts the rail with the site's name, and lists the collections in it", () => {
    const [rail = "", compact, bar] = navs(render("/sheets"));
    expect(rail).toMatch(/<a class="nav-rail-name"[^>]*>Sheet Library<\/a>/);
    expect(link(rail, "/sheets")).toContain('class="nav-rail-name"');
    expect(rail).toMatch(/Campfire.*21 sheets.*Christmas.*1 sheet</s);
    expect(compact).not.toContain("Campfire");
    expect(bar).not.toContain("Campfire");
  });

  // Scenarios "The open screen" and "A collection on a phone".
  it("marks a collection in the rail, and Collections where it isn't listed", () => {
    const [rail = "", compact = "", bar = ""] = navs(
      render("/collections/christmas000"),
    );
    expect(link(rail, "/collections/christmas000")).toContain(
      'aria-current="page"',
    );
    expect(link(rail, "/collections")).not.toContain("aria-current");
    expect(link(compact, "/collections")).toContain('aria-current="true"');
    expect(link(bar, "/collections")).toContain('aria-current="true"');
    expect(link(bar, "/sheets")).not.toContain("aria-current");
  });

  // Requirement "Bottom bar on phones".
  it("has Sheets, Collections and the account in the bar", () => {
    const [, , bar = ""] = navs(render("/sheets"));
    expect(bar.match(/<a /g)).toHaveLength(3);
    expect(link(bar, "/sheets")).toContain('aria-current="page"');
    expect(bar).toMatch(/Sheets<\/a>.*Collections<\/a>.*Account<\/a><\/nav>$/s);
  });

  // Requirement "Account in the shell".
  it("shows the account as its initial in the rails and in the bar", () => {
    const html = render("/sheets");
    const [rail, compact, bar] = navs(html);
    expect(rail).toMatch(
      /<span class="nav-avatar" aria-hidden="true">A<\/span>Account<\/a>/,
    );
    expect(link(compact ?? "", "/account")).toContain('aria-label="Account"');
    expect(bar).toMatch(
      /<span class="nav-bar-icon"><span class="nav-avatar" aria-hidden="true">A<\/span><\/span>Account<\/a>/,
    );
    expect(html).not.toContain('aria-current="page" href="/account"');
  });

  // The search field belongs to the Sheets screen.
  it("has no search field of its own", () => {
    expect(render("/collections")).not.toContain('role="search"');
  });

  // Scenario "On the account page".
  it("marks the account on the account page, and nothing else", () => {
    const html = render("/account");
    const marks = [...html.matchAll(/<a [^>]*aria-current="[^"]*"[^>]*>/g)];
    expect(marks).toHaveLength(3);
    for (const [mark] of marks) expect(mark).toContain('href="/account"');
  });
});

// The whole route, with the screen inside it and its data.
describe("Shell", () => {
  function render(path: string, Screen = () => <h1>Screen</h1>) {
    const Stub = createRoutesStub([
      {
        id: "routes/shell",
        Component: Shell as never,
        loader: () => ({ collections }),
        children: [
          { id: "routes/collections", path: "/collections", Component: Screen },
          {
            id: "routes/collection",
            path: "/collections/:id",
            Component: Screen,
          },
        ],
      },
    ]);
    return renderToString(
      <SignedInContext value={{ initial: "A" }}>
        <Stub
          initialEntries={[path]}
          hydrationData={{ loaderData: { "routes/shell": { collections } } }}
        />
      </SignedInContext>,
    );
  }

  it("marks the screen that is open, with the person's initial", () => {
    const html = render("/collections");
    const [rail = ""] = navs(html);
    expect(link(rail, "/collections")).toContain('aria-current="page"');
    expect(html).toContain('<span class="nav-avatar" aria-hidden="true">A<');
  });

  // A collection that isn't found shows inside the shell, without a top bar.
  it("shows a collection that isn't found in the content", () => {
    const html = render("/collections/unknown00000", () => (
      <NotFound what="collection" />
    ));
    expect(html).toMatch(
      /<main [^>]*><div class="sheet-not-found"><h1>Collection not found<\/h1>/,
    );
    expect(html).not.toContain("<header");
    const [rail = ""] = navs(html);
    expect(link(rail, "/collections")).toContain('aria-current="page"');
  });
});
