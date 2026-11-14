import { renderToString } from "react-dom/server";
import { createRoutesStub, RouterContextProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { addPasskey } from "../auth/passkeys.test-helper";
import { cloudflareContext, sessionContext } from "../context";
import { testEnv } from "../db/local-env.test-helper";
import { seedSong } from "../editor/seed-song";
import {
  createSheet,
  readSheet,
  type SearchResult,
  type SheetListItem,
} from "../sheets/sheets.server";
import { addUser } from "../sheets/sheets.test-helper";
import type { Route } from "./+types/sheets";
import { action, LibraryView, loader, meta } from "./sheets";

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
  const post = (userId: string | null) =>
    action({ context: context(userId) } as unknown as Route.ActionArgs);

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
          updatedAt: expect.any(Number) as number,
        },
      ],
      hasSheets: true,
      q: "",
      offerPasskey: false,
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
    const response = await post("ana");
    expect(response.status).toBe(302);
    const id = /^\/sheets\/([\w-]+)\/edit\?new$/.exec(
      response.headers.get("Location") ?? "",
    )?.[1];
    expect(await readSheet(test.env.DB, "ana", id ?? "")).toMatchObject({
      title: "Untitled",
      content: { format: "chordsheet", version: 1, sections: [] },
    });
  });

  it("sends a new sheet without a session to sign-in", async () => {
    const response = await post(null);
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/sign-in");
  });
});

// The page needs a router for its form.
function render(
  sheets: (SheetListItem | SearchResult)[],
  offerPasskey?: boolean,
  search: { q?: string; hasSheets?: boolean } = {},
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

  it("lists the sheets, each linking to it, with its artist and last edit", () => {
    const html = render([
      {
        id: "abcdefghijkl",
        title: "Hallelujah",
        artist: "Leonard Cohen",
        updatedAt: today,
      },
      { id: "mnopqrstuvwx", title: "Amazing Grace", updatedAt: today },
    ]);
    expect(html).toMatch(
      /<a [^>]*href="\/sheets\/abcdefghijkl"[^>]*>.*Hallelujah.*Leonard Cohen/,
    );
    expect(html).toContain('href="/sheets/mnopqrstuvwx"');
    expect(html.indexOf("Hallelujah")).toBeLessThan(
      html.indexOf("Amazing Grace"),
    );
    expect(html).toContain("New sheet");
    expect(html).not.toContain("No sheets yet");
  });

  it("offers Import before New sheet, beside the heading and docked", () => {
    const html = render([
      { id: "abcdefghijkl", title: "Hallelujah", updatedAt: today },
    ]);
    const beside = /library-actions-beside">(.*?)<\/form><\/div>/s.exec(html);
    const docked = /library-actions-docked">(.*?)<\/form><\/div>/s.exec(html);
    for (const actions of [beside?.[1], docked?.[1]]) {
      expect(actions).toMatch(
        /class="button button-tonal[^"]*menu-toggle-text"[^>]*aria-haspopup="menu".*Import<svg .*New sheet<\/button>/s,
      );
    }
    expect(beside?.[1]).toContain('class="menu menu-below-start"');
    expect(docked?.[1]).toContain('class="menu menu-above-end"');
    expect(docked?.[1]).toMatch(/button-tonal button-large/);
    expect(docked?.[1]).toMatch(/button-filled button-large/);
  });

  // Scenario "Opening Sheets".
  it("is headed Sheets, without a Library heading, tabs or a top bar", () => {
    for (const sheets of [
      [{ id: "abcdefghijkl", title: "Hallelujah", updatedAt: today }],
      [],
    ]) {
      const html = render(sheets);
      expect(html).toMatch(/^<div class="library[^"]*">.*<h1>Sheets<\/h1>/s);
      expect(html).not.toContain("Library</h1>");
      expect(html).not.toContain("<nav");
      expect(html).not.toContain("<header");
      expect(html).not.toContain("<main");
    }
  });

  it("hides the last edit until the viewer's time zone is known", () => {
    const html = render([
      {
        id: "abcdefghijkl",
        title: "Hallelujah",
        updatedAt: Date.UTC(2025, 8, 3, 12),
      },
    ]);
    expect(html).toContain(
      '<span class="library-edited" data-pending="">3 Sep 2025</span>',
    );
  });

  // Scenario "First sign-in".
  it("says there are no sheets yet, and offers Import and a new sheet", () => {
    const html = render([]);
    expect(html).toContain("No sheets yet");
    expect(html).toMatch(
      /aria-haspopup="menu".*Import<svg .*<form [^>]*method="post"[^>]*>.*New sheet<\/button>/s,
    );
    expect(html).not.toContain("<ul");
    expect(html).not.toContain("library-actions-docked");
  });

  // Scenarios "First email sign-in" and "Opening the account page".
  it("offers a passkey under the heading, linking to the account page", () => {
    for (const sheets of [
      [{ id: "abcdefghijkl", title: "Hallelujah", updatedAt: today }],
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
        html.indexOf(sheets.length ? "<ul" : "No sheets yet"),
      );
    }
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
    expect(html).not.toContain("No sheets yet");
  });
});
