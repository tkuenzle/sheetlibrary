import { renderToString } from "react-dom/server";
import { createRoutesStub, RouterContextProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { addPasskey } from "../auth/passkeys.test-helper";
import { cloudflareContext, sessionContext } from "../context";
import { testEnv } from "../db/local-env.test-helper";
import { seedSong } from "../editor/seed-song";
import {
  createSheet,
  readSheet,
  recordOpening,
  type SearchResult,
  type SheetListItem,
} from "../sheets/sheets.server";
import { noteSkeletonShown } from "../shell/awaited";
import { browserMovedContext, showPage } from "../shell/page-moves";
import { HEAD_START } from "../shell/slow-wait";
import { addUser } from "../sheets/sheets.test-helper";
import type { Route } from "./+types/sheets";
import {
  action,
  clientAction,
  clientLoader,
  LibrarySkeleton,
  LibraryView,
  loader,
  meta,
  useLastLoaded,
} from "./sheets";

describe("library loader and action", () => {
  let test: Awaited<ReturnType<typeof testEnv>>;
  beforeEach(async () => {
    test = await testEnv();
    await addUser(test.env.DB, "ana");
  });
  afterEach(() => test.dispose());

  function context(userId: string | null) {
    const context = new RouterContextProvider();
    context.set(cloudflareContext, { env: test.env });
    // Only the user's id matters here.
    const session = { user: { id: userId }, session: {} } as never;
    context.set(sessionContext, userId ? session : null);
    return context;
  }

  const load = (userId: string | null, search = "", cookie?: string) => {
    const url = new URL(`https://sheetlibrary.com/sheets${search}`);
    const request = new Request(url, {
      headers: cookie ? { Cookie: cookie } : {},
    });
    return loader({
      context: context(userId),
      request,
      url,
    } as unknown as Route.LoaderArgs);
  };
  function post(userId: string | null, fields: [string, string][] = []) {
    const body = new FormData();
    for (const [name, value] of fields) body.append(name, value);
    const request = new Request("https://sheetlibrary.com/sheets", {
      method: "POST",
      body,
    });
    return action({
      context: context(userId),
      request,
    } as unknown as Route.ActionArgs);
  }

  it("gives the person their sheets", async () => {
    const sheet = await createSheet(test.env.DB, "ana", {
      title: "Amazing Grace",
      content: seedSong,
    });
    expect(await load("ana")).toEqual({
      sheets: [
        {
          id: sheet.id,
          title: "Amazing Grace",
          key: "G",
          updatedAt: expect.any(Number) as number,
          addedAt: expect.any(Number) as number,
        },
      ],
      recent: [],
      hasSheets: true,
      q: "",
      offerPasskey: false,
      order: "title",
    });
  });

  // Requirement "Recent sheets".
  it("gives the sheets opened last, but not while searching", async () => {
    const sheet = await createSheet(test.env.DB, "ana", {
      title: "Amazing Grace",
      content: seedSong,
    });
    await recordOpening(test.env.DB, "ana", sheet.id);
    expect(await load("ana")).toMatchObject({
      recent: [{ id: sheet.id, title: "Amazing Grace", key: "G" }],
    });
    expect(await load("ana", "?q=grace")).toMatchObject({ recent: [] });
  });

  // Scenario "From Sheets to a collection".
  it("gives the order this device keeps", async () => {
    expect(await load("ana", "", "a=1; sheet-order=added")).toMatchObject({
      order: "added",
    });
    expect(await load("ana", "?q=grace", "sheet-order=artist")).toMatchObject({
      order: "artist",
    });
  });

  it("searches with q, the best match first", async () => {
    for (const title of ["Hallelujah", "Amazing Grace"]) {
      await createSheet(test.env.DB, "ana", { title, content: seedSong });
    }
    expect(await load("ana", "?q=grace")).toMatchObject({
      sheets: [
        {
          title: "Amazing Grace",
          titleParts: [
            { text: "Amazing ", hit: false },
            { text: "Grace", hit: true },
          ],
        },
        // The seed song's lyrics are those of Amazing Grace.
        { title: "Hallelujah", line: expect.any(Array) as unknown },
      ],
      hasSheets: true,
      q: "grace",
    });
  });

  // Scenario "One character".
  it("lists all sheets for a q of one character", async () => {
    for (const title of ["Hallelujah", "Amazing Grace"]) {
      await createSheet(test.env.DB, "ana", { title, content: seedSong });
    }
    const data = (await load("ana", "?q=a")) as { sheets: SheetListItem[] };
    expect(data.sheets.map((sheet) => sheet.title)).toEqual([
      "Amazing Grace",
      "Hallelujah",
    ]);
  });

  it("says the person has sheets when a search finds none", async () => {
    await createSheet(test.env.DB, "ana", {
      title: "Amazing Grace",
      content: seedSong,
    });
    expect(await load("ana", "?q=k%C3%B6nigin")).toMatchObject({
      sheets: [],
      hasSheets: true,
      q: "königin",
    });
  });

  it("says the person has no sheets", async () => {
    expect(await load("ana", "?q=grace")).toMatchObject({
      sheets: [],
      hasSheets: false,
    });
  });

  // Scenario "First email sign-in".
  it("offers a passkey after an email sign-in", async () => {
    expect(await load("ana", "?passkey")).toMatchObject({
      offerPasskey: true,
    });
  });

  // Scenario "Account with a passkey".
  it("offers no passkey to an account that has one", async () => {
    await addPasskey(test.env.DB, "ana");
    expect(await load("ana", "?passkey")).toMatchObject({
      offerPasskey: false,
    });
  });

  // Scenario "Closed before".
  it("offers no passkey once this device closed the offer", async () => {
    expect(
      await load("ana", "?passkey", "a=1; passkey-offer=closed"),
    ).toMatchObject({ offerPasskey: false });
  });

  // A reload, or a passkey sign-in, has no `?passkey`.
  it("offers no passkey without ?passkey", async () => {
    expect(await load("ana")).toMatchObject({ offerPasskey: false });
  });

  // Scenario "Not signed in".
  it("sends visitors who aren't signed in to sign-in", async () => {
    const response = (await load(null)) as Response;
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/sign-in");
  });

  // Scenario "Naming a new sheet": `?new` opens the title field.
  it("creates an Untitled sheet and opens it, to be named", async () => {
    const response = (await post("ana")) as Response;
    expect(response.status).toBe(302);
    const id = /^\/sheets\/([\w-]+)\/edit\?new$/.exec(
      response.headers.get("Location") ?? "",
    )?.[1];
    expect(await readSheet(test.env.DB, "ana", id ?? "")).toMatchObject({
      title: "Untitled",
      content: { format: "chordsheet", version: 1, sections: [] },
    });
  });

  // Requirement "Deleting from a row".
  it("deletes a sheet from its row", async () => {
    const { id } = await createSheet(test.env.DB, "ana", {
      title: "Stille Nacht",
      content: seedSong,
    });
    expect(
      await post("ana", [
        ["intent", "delete"],
        ["sheetId", id],
      ]),
    ).toEqual({ ok: true, intent: "delete" });
    expect(await readSheet(test.env.DB, "ana", id)).toBeNull();
  });

  it("answers 404 for someone else's sheet, and keeps it", async () => {
    await addUser(test.env.DB, "bo");
    const { id } = await createSheet(test.env.DB, "bo", {
      title: "Shenandoah",
      content: seedSong,
    });
    const answer = (await post("ana", [
      ["intent", "delete"],
      ["sheetId", id],
    ])) as unknown as { data: unknown; init: { status: number } };
    expect(answer.data).toEqual({ ok: false, intent: "delete" });
    expect(answer.init.status).toBe(404);
    expect(await readSheet(test.env.DB, "bo", id)).not.toBeNull();
  });

  it("sends a new sheet without a session to sign-in", async () => {
    const response = (await post(null)) as Response;
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/sign-in");
  });
});

// The page needs a router for its form.
function render(
  sheets: (SheetListItem | SearchResult)[],
  offerPasskey?: boolean,
  search: {
    q?: string;
    hasSheets?: boolean;
    searchFailed?: boolean;
    recent?: SheetListItem[];
  } = {},
) {
  const Stub = createRoutesStub([
    {
      path: "/",
      Component: () => (
        <LibraryView sheets={sheets} offerPasskey={offerPasskey} {...search} />
      ),
    },
  ]);
  return renderToString(<Stub />);
}

describe("library page", () => {
  const today = Date.now();

  // Requirement "My sheets": the rows are the shared list's.
  it("lists the sheets A to Z, each linking to it, with its artist", () => {
    const html = render([
      {
        id: "abcdefghijkl",
        title: "Hallelujah",
        artist: "Leonard Cohen",
        updatedAt: today,
        addedAt: today,
      },
      {
        id: "mnopqrstuvwx",
        title: "Amazing Grace",
        updatedAt: today,
        addedAt: today,
      },
    ]);
    expect(html).toMatch(
      /<a [^>]*href="\/sheets\/abcdefghijkl"[^>]*>.*Hallelujah.*Leonard Cohen/,
    );
    expect(html).toContain('href="/sheets/mnopqrstuvwx"');
    expect(html.indexOf("Amazing Grace")).toBeLessThan(
      html.indexOf("Hallelujah"),
    );
    expect(html).toContain('aria-label="More for Hallelujah"');
    expect(html).not.toContain("Add your first sheet");
  });

  // Requirement "All sheets heading".
  it("heads the list with the number of sheets, but not while searching", () => {
    const sheet = (id: string, title: string): SheetListItem => ({
      id,
      title,
      updatedAt: today,
      addedAt: today,
    });
    const both = [
      sheet("grace0000000", "Amazing Grace"),
      sheet("stille000000", "Stille Nacht"),
    ];
    expect(render(both)).toMatch(
      /<h2 class="sheet-list-heading">All sheets <span class="sheet-list-count">2<\/span><\/h2>/,
    );
    expect(render(both, false, { q: "grace" })).not.toContain("All sheets");
  });

  describe("recent", () => {
    const stille: SheetListItem = {
      id: "stille000000",
      title: "Stille Nacht",
      artist: "Franz Xaver Gruber",
      key: "C",
      updatedAt: today,
      addedAt: today,
    };
    const grace: SheetListItem = {
      id: "grace0000000",
      title: "Amazing Grace",
      key: "G",
      updatedAt: today,
      addedAt: today,
    };
    const recentPart = (html: string) =>
      /<section class="recent-sheets".*?<\/section>/.exec(html)?.[0] ?? "";

    // Scenario "Opened last".
    it("shows the sheets opened last as cards, in that order, between the search and the list", () => {
      const html = render([grace, stille], false, { recent: [stille, grace] });
      const part = recentPart(html);
      expect(part).toMatch(/<h2 id="recent-sheets">Recent<\/h2>/);
      expect(part).toMatch(
        /<a [^>]*href="\/sheets\/stille000000"[^>]*><span class="recent-sheets-title">Stille Nacht<\/span><span>Franz Xaver Gruber<\/span><span class="recent-sheets-key"><span aria-hidden="true">C<\/span>/,
      );
      expect(part.indexOf("Stille Nacht")).toBeLessThan(
        part.indexOf("Amazing Grace"),
      );
      expect(part).not.toContain("More for");
      expect(html.indexOf('type="search"')).toBeLessThan(
        html.indexOf("recent-sheets"),
      );
      expect(html.indexOf("recent-sheets")).toBeLessThan(
        html.indexOf("library-labels"),
      );
    });

    // Scenario "Searching".
    it("is hidden while searching", () => {
      const html = render([grace], false, { q: "grace", recent: [grace] });
      expect(html).not.toContain("recent-sheets");
    });

    it("is hidden when no sheet has been opened", () => {
      const html = render([grace], false, { recent: [] });
      expect(html).not.toContain("recent-sheets");
      expect(html).not.toContain(">Recent<");
    });
  });

  // Requirements "New sheet" and "Sheets and Collections screens": no
  // button beside the heading, and no Import. "New sheet" belongs to the
  // shell (routes/shell.tsx).
  it("has no New sheet or Import of its own", () => {
    const html = render([
      {
        id: "abcdefghijkl",
        title: "Hallelujah",
        updatedAt: today,
        addedAt: today,
      },
    ]);
    expect(html).toContain('<h1 tabindex="-1">Sheets</h1>');
    expect(html).not.toContain("New sheet");
    expect(html).not.toContain(">Import<");
    expect(html).not.toContain("library-actions");
  });

  // Scenario "Opening Sheets".
  it("is headed Sheets, without a Library heading, tabs or a top bar", () => {
    for (const sheets of [
      [
        {
          id: "abcdefghijkl",
          title: "Hallelujah",
          updatedAt: today,
          addedAt: today,
        },
      ],
      [],
    ]) {
      const html = render(sheets);
      expect(html).toMatch(
        /^<div class="library[^"]*">.*<h1[^>]*>Sheets<\/h1>/s,
      );
      expect(html).not.toContain("Library</h1>");
      expect(html).not.toContain("<nav");
      expect(html).not.toContain("<header");
      expect(html).not.toContain("<main");
    }
  });

  // Scenarios "First sign-in" and "Empty library on a phone".
  it("offers the three ways as cards, without a floating button", () => {
    const html = render([]);
    expect(html).toContain('<h2 id="library-first">Add your first sheet</h2>');
    expect(html).toContain(
      "Pick a way to start. Everything can be edited later.",
    );
    const labels = [
      ...html.matchAll(/class="library-way-label">([^<]*)</g),
    ].map((match) => match[1]);
    expect(labels).toEqual(["Write it", "From photos", "From Ultimate Guitar"]);
    expect(html).not.toContain("floating-button");
    expect(html).not.toContain("No sheets yet");
  });

  // Scenario "Writing the first sheet": a form that posts to /sheets, so it
  // works before the scripts load. The imports are buttons.
  it("posts Write it to /sheets, and makes the imports buttons", () => {
    const html = render([]);
    expect(html).toMatch(
      /<form [^>]*action="\/sheets" method="post"><button type="submit" class="library-way">.*?Write it/s,
    );
    expect(
      html.match(/<button type="button" class="library-way">/g),
    ).toHaveLength(2);
  });

  // Scenarios "First email sign-in" and "Opening the account page".
  it("offers a passkey under the heading, linking to the account page", () => {
    for (const sheets of [
      [
        {
          id: "abcdefghijkl",
          title: "Hallelujah",
          updatedAt: today,
          addedAt: today,
        },
      ],
      [],
    ]) {
      const html = render(sheets, true);
      expect(html).toContain(
        "Add a passkey to sign in on this device without waiting for an email.",
      );
      expect(html).toMatch(/<a [^>]*href="\/account"[^>]*>.*Add passkey<\/a>/);
      expect(html).toMatch(/aria-label="Close"/);
      expect(html.indexOf("passkey-offer")).toBeGreaterThan(
        html.indexOf("<h1>Library</h1>"),
      );
      expect(html.indexOf("passkey-offer")).toBeLessThan(
        html.indexOf(sheets.length ? "<ul" : "Add your first sheet"),
      );
    }
  });

  // Scenario "From Sheets to a collection": the list starts in the order
  // the loader read from the cookie.
  it("lists the sheets in the order this device keeps", () => {
    const Stub = createRoutesStub([
      {
        path: "/",
        Component: () => (
          <LibraryView
            order="artist"
            sheets={[
              {
                id: "abcdefghijkl",
                title: "Amazing Grace",
                updatedAt: today,
                addedAt: today,
              },
              {
                id: "mnopqrstuvwx",
                title: "Hallelujah",
                artist: "Leonard Cohen",
                updatedAt: today,
                addedAt: today,
              },
            ]}
          />
        ),
      },
    ]);
    const html = renderToString(<Stub />);
    expect(html.indexOf("Hallelujah")).toBeLessThan(
      html.indexOf("Amazing Grace"),
    );
    expect(html).toMatch(/Artist<svg/);
  });

  it("offers no passkey without offerPasskey", () => {
    expect(render([])).not.toContain("passkey-offer");
    expect(render([], false)).not.toContain("passkey-offer");
  });

  it("sets the page title and asks search engines not to index it", () => {
    expect(meta()).toContainEqual({ title: "Sheets | Sheet Library" });
    expect(meta()).toContainEqual({ name: "robots", content: "noindex" });
  });
});

describe("library search", () => {
  const today = Date.now();
  const grace: SheetListItem = {
    id: "abcdefghijkl",
    title: "Amazing Grace",
    updatedAt: today,
    addedAt: today,
  };

  it("shows the field below the heading, without a count", () => {
    const html = render([grace]);
    expect(html).toMatch(/<\/h1>.*<form[^>]*role="search"/s);
    expect(html).toMatch(/<form [^>]*method="get"/);
    expect(html).toContain('aria-label="Search sheets"');
    expect(html).toContain('placeholder="Search titles, artists and lyrics"');
    expect(html).toContain('name="q"');
    expect(html).toMatch(
      /<span class="search-field-count" role="status"><\/span>/,
    );
    expect(html).not.toContain("Clear search");
  });

  it("hides the field without sheets", () => {
    expect(render([])).not.toContain('role="search"');
  });

  // Scenario "Count".
  it("says how many sheets match, and offers to clear the search", () => {
    const results = [grace, { ...grace, id: "mnopqrstuvwx" }];
    const html = render(
      results.map((sheet) => ({
        ...sheet,
        titleParts: [{ text: sheet.title, hit: false }],
      })),
      false,
      { q: "grace", hasSheets: true },
    );
    expect(html).toContain('value="grace"');
    expect(html).toContain('role="status">2 sheets</span>');
    expect(html).toContain('aria-label="Clear search"');
    expect(
      render([{ ...grace, titleParts: [] }], false, { q: "grace" }),
    ).toContain('role="status">1 sheet</span>');
  });

  // Scenario "One character".
  it("shows no count for one character", () => {
    expect(render([grace], false, { q: "a" })).toMatch(
      /role="status"><\/span>/,
    );
  });

  // Scenarios "Title match" and "Lyrics match".
  it("marks the matches, with the line for a lyrics match", () => {
    const html = render(
      [
        {
          id: "abcdefghijkl",
          title: "Drüü Könige",
          artist: "Trad.",
          updatedAt: today,
          addedAt: today,
          titleParts: [
            { text: "Drüü ", hit: false },
            { text: "Könige", hit: true },
          ],
          artistParts: [{ text: "Trad.", hit: false }],
        },
        {
          id: "mnopqrstuvwx",
          title: "Sternsinger",
          updatedAt: today,
          addedAt: today,
          titleParts: [{ text: "Sternsinger", hit: false }],
          line: [
            { text: "Drei ", hit: false },
            { text: "Könige", hit: true },
            { text: " ziehen", hit: false },
          ],
        },
      ],
      false,
      { q: "könige", hasSheets: true },
    );
    expect(html).toContain(
      '<span class="library-title">Drüü <mark>Könige</mark></span>',
    );
    expect(html).toContain(
      '<span class="library-line">Drei <mark>Könige</mark> ziehen</span>',
    );
    expect(html.match(/library-line/g)).toHaveLength(1);
  });

  // Scenario "Nothing found".
  it("says no sheet matches, in place of the list", () => {
    const html = render([], false, { q: "königin", hasSheets: true });
    expect(html).toContain("No sheets match “königin”");
    expect(html).toContain('role="search"');
    expect(html).not.toContain('class="group-list"');
    expect(html).not.toContain("Add your first sheet");
  });
});

describe("a search that doesn't go through", () => {
  const grace: SheetListItem = {
    id: "abcdefghijkl",
    title: "Amazing Grace",
    updatedAt: Date.now(),
    addedAt: Date.now(),
  };
  const offline = new TypeError("Failed to fetch");
  // A search: the page that is open loads again, online.
  beforeEach(() => {
    showPage({ path: "/sheets", kind: { kind: "shell" } });
    vi.stubGlobal("navigator", { onLine: true });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });
  const load = (serverLoader: () => Promise<unknown>) =>
    clientLoader({
      context: new RouterContextProvider(),
      serverLoader,
      url: new URL("https://sheetlibrary.com/sheets?q=grace"),
    } as unknown as Route.ClientLoaderArgs);

  it("doesn't fail the page when the server can't be reached", async () => {
    const data = await load(() => Promise.reject(offline));
    expect(data).toEqual({ failed: true, error: offline });
  });

  it("fails the page for any other error", async () => {
    const error = new Error("Unexpected Server Error");
    await expect(load(() => Promise.reject(error))).rejects.toBe(error);
  });

  it("passes the results on when the search goes through", async () => {
    const results = { sheets: [grace], hasSheets: true, q: "grace" };
    expect(await load(() => Promise.resolve(results))).toBe(results);
  });

  // Scenario "Offline while typing".
  it("says so below the field, and keeps the results", () => {
    const html = render([grace], false, {
      q: "grace",
      hasSheets: true,
      searchFailed: true,
    });
    expect(html).toMatch(
      /<\/form><p class="library-search-failed" role="status">.*Couldn’t search\. Showing the last results\.<\/p>/s,
    );
    expect(html).toContain("Amazing Grace");
  });

  it("has no note while searches go through", () => {
    expect(
      render([grace], false, { q: "grace", hasSheets: true }),
    ).not.toContain("library-search-failed");
  });

  // With nothing loaded yet, the screen throws the error to its boundary.
  // Boundaries don't catch while rendering to a string, so it shows here.
  it("fails the screen when there are no results to keep", () => {
    const Stub = createRoutesStub([
      {
        path: "/sheets",
        Component: () => {
          useLastLoaded({
            failed: true,
            error: offline,
          } as unknown as Parameters<typeof useLastLoaded>[0]);
          return null;
        },
      },
    ]);
    expect(() => renderToString(<Stub initialEntries={["/sheets"]} />)).toThrow(
      offline,
    );
  });
});

// Requirement "A skeleton while a page loads".
describe("Sheets while its sheets load", () => {
  const results = { sheets: [], hasSheets: false, q: "" };
  // A move from Collections to Sheets.
  const move = (
    serverLoader: () => Promise<unknown>,
    context = new RouterContextProvider(),
  ) =>
    clientLoader({
      context,
      serverLoader,
      url: new URL("https://sheetlibrary.com/sheets"),
    } as unknown as Route.ClientLoaderArgs) as Promise<{ page: unknown }>;
  beforeEach(() => {
    showPage({ path: "/collections", kind: { kind: "shell" } });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("moves in whole when the sheets come in a moment", async () => {
    const data = await move(() => Promise.resolve(results));
    expect(data.page).toBe(results);
  });

  it("hands the sheets over on their way when they are slow", async () => {
    vi.useFakeTimers();
    const slow = new Promise((resolve) => {
      setTimeout(() => {
        resolve(results);
      }, 1000);
    });
    const data = move(() => slow);
    await vi.advanceTimersByTimeAsync(HEAD_START);
    const { page } = await data;
    expect(page).toBeInstanceOf(Promise);
    noteSkeletonShown();
    await vi.advanceTimersByTimeAsync(1000);
    await expect(page).resolves.toBe(results);
  });

  it("doesn't wait after the browser's own move", async () => {
    const context = new RouterContextProvider();
    context.set(browserMovedContext, true);
    const data = await move(() => Promise.resolve(results), context);
    expect(data.page).toBeInstanceOf(Promise);
  });

  function renderSkeleton(url = "/sheets") {
    const Stub = createRoutesStub([
      { path: "/sheets", Component: LibrarySkeleton },
    ]);
    return renderToString(<Stub initialEntries={[url]} />);
  }

  it("shows the heading, the search field, and bars for Recent and the list", () => {
    const html = renderSkeleton();
    expect(html).toMatch(/<h1[^>]*>Sheets<\/h1>/);
    expect(html).toContain('aria-label="Search sheets"');
    expect(html).toContain("recent-sheets-skeleton");
    expect(html).toMatch(
      /All sheets <span class="sheet-list-count"><span class="skeleton-bar"/,
    );
    expect(html.match(/sheet-list-skeleton"/g)).toHaveLength(8);
  });

  it("has no Recent for a search in the address", () => {
    const html = renderSkeleton("/sheets?q=grace");
    expect(html).not.toContain("recent-sheets-skeleton");
    expect(html).toContain('value="grace"');
  });
});

// Scenario "Deleting offline": the list stays, and the row comes back.
describe("a row's change that doesn't get through", () => {
  it("answers { ok: false } rather than failing the page", async () => {
    const body = new FormData();
    body.append("intent", "delete");
    body.append("sheetId", "stille000000");
    const answer = await clientAction({
      request: new Request("https://sheetlibrary.com/sheets", {
        method: "POST",
        body,
      }),
      serverAction: () => Promise.reject(new TypeError("Failed to fetch")),
    } as unknown as Parameters<typeof clientAction>[0]);
    expect(answer).toEqual({ ok: false, intent: "delete" });
  });
});
