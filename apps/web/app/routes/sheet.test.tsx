import type { Sheet } from "chordsheet";
import { renderToString } from "react-dom/server";
import { RouterContextProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { cloudflareContext, sessionContext } from "../context";
import { testEnv } from "../db/local-env.test-helper";
import { seedSong } from "../editor/seed-song";
import { createSheet } from "../sheets/sheets.server";
import { addUser } from "../sheets/sheets.test-helper";
import type { Route } from "./+types/sheet";
import { loader, meta, PlayView } from "./sheet";

const amazingGrace: Sheet = {
  id: "abcdefghijkl",
  revision: 1,
  title: "Amazing Grace",
  artist: "John Newton",
  content: seedSong,
};

describe("play view loader", () => {
  let test: Awaited<ReturnType<typeof testEnv>>;
  let sheet: Sheet;
  beforeEach(async () => {
    test = await testEnv();
    await addUser(test.env.DB, "ana");
    await addUser(test.env.DB, "bo");
    sheet = await createSheet(test.env.DB, "ana", {
      title: "Amazing Grace",
      content: seedSong,
    });
  });
  afterEach(() => test.dispose());

  function load(
    userId: string | null,
    id = sheet.id,
    search = "",
    cookie = "",
  ) {
    const context = new RouterContextProvider();
    context.set(cloudflareContext, { env: test.env });
    // Only the user's id matters here.
    const session = { user: { id: userId }, session: {} } as never;
    context.set(sessionContext, userId ? session : null);
    const url = new URL(`https://sheetlibrary.test/sheets/${id}${search}`);
    const request = new Request(url, { headers: { Cookie: cookie } });
    return loader({
      context,
      params: { id },
      request,
      url,
    } as unknown as Route.LoaderArgs);
  }

  // Scenario "Opening a sheet".
  it("gives the owner their sheet, with the key and capo to show", async () => {
    expect(await load("ana", sheet.id, "?key=A&capo=2")).toEqual({
      sheet,
      shownKey: "A",
      capo: "2",
      textStep: 0,
    });
  });

  // Scenario "Larger on this device".
  it("passes on this device's text size", async () => {
    expect(await load("ana", sheet.id, "", "play-text-size=2")).toMatchObject({
      textStep: 2,
    });
  });

  it("sends visitors who aren't signed in to sign-in", async () => {
    const response = (await load(null)) as Response;
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/sign-in");
  });

  // Scenario "Someone else's sheet".
  it("answers 404 for someone else's sheet, as for an unknown id", async () => {
    for (const answer of [
      await load("bo"),
      await load("ana", "AAAAAAAAAAAA"),
    ]) {
      expect(answer).toMatchObject({
        data: { sheet: null },
        init: { status: 404 },
      });
    }
  });
});

describe("play view", () => {
  // Scenario "Opening a sheet".
  it("shows the title, the artist and the sheet", () => {
    const html = renderToString(<PlayView sheet={amazingGrace} />);
    expect(html).toContain("<h1>Amazing Grace</h1>");
    expect(html).toContain('<p class="play-artist">John Newton</p>');
    expect(html).toContain('<div class="sheet-view-label">Verse 1</div>');
  });

  it("has no editor, save state or help", () => {
    const html = renderToString(<PlayView sheet={amazingGrace} />);
    expect(html).not.toContain("contenteditable");
    expect(html).not.toContain('role="status"');
    expect(html).not.toContain("How to edit");
  });

  it("shows the lyrics larger than the editor", () => {
    const html = renderToString(<PlayView sheet={amazingGrace} />);
    expect(html).toContain("--sheet-view-font-size:var(--play-text-base)");
  });

  it("shows the sheet in the key the address holds", () => {
    const html = renderToString(<PlayView sheet={amazingGrace} shownKey="A" />);
    expect(html).toContain('<span class="sheet-view-chord">A7</span>');
    expect(html).not.toContain('<span class="sheet-view-chord">G7</span>');
    expect(html).toMatch(/Key <!-- -->A/);
  });

  it("shows the shapes for the capo the address holds", () => {
    const html = renderToString(<PlayView sheet={amazingGrace} capo="2" />);
    expect(html).toContain('<span class="sheet-view-chord">F7</span>');
    expect(html).toContain('<span class="sheet-view-chord">Bb</span>');
  });

  // Scenario "Opened in another key": in A with capo 2, the shapes are G.
  it("shows a key and a capo together", () => {
    const html = renderToString(
      <PlayView sheet={amazingGrace} shownKey="A" capo="2" />,
    );
    expect(html).toContain('aria-label="Key A, 2 semitones up"');
    expect(html).toContain("Capo 2, G shapes");
    expect(html).toContain('<span class="sheet-view-chord">G7</span>');
  });

  // Scenario "Transposing to play".
  it("offers the key panel to view only", () => {
    const html = renderToString(<PlayView sheet={amazingGrace} />);
    expect(html).toContain('class="key-button-toggle"');
    expect(html).toContain("Capo");
  });

  it("has no key or capo for a sheet without chords", () => {
    const empty = {
      ...amazingGrace,
      content: { ...seedSong, sections: [{ lines: [] }] },
    };
    expect(renderToString(<PlayView sheet={empty} />)).not.toContain(
      "key-button",
    );
  });

  // Scenario "From playing to editing" (site-layout).
  it("has the switch, with Play marked and the key and capo carried", () => {
    const html = renderToString(
      <PlayView sheet={amazingGrace} shownKey="F#" capo="1" />,
    );
    expect(html).toMatch(/aria-label="Play" aria-current="page"/);
    expect(html).toContain(
      'href="/sheets/abcdefghijkl/edit?key=F%23&amp;capo=1"',
    );
  });

  it("shows the text size this device keeps", () => {
    const html = renderToString(<PlayView sheet={amazingGrace} textStep={1} />);
    expect(html).toContain(
      "--sheet-view-font-size:calc(var(--play-text-base) * 1.15)",
    );
  });

  it("disables Smaller text and Larger text at the ends", () => {
    const button = (html: string, label: string) =>
      new RegExp(`aria-label="${label}"[^>]*>`).exec(html)?.[0] ?? "";
    const middle = renderToString(<PlayView sheet={amazingGrace} />);
    expect(button(middle, "Smaller text")).not.toContain("disabled");
    expect(button(middle, "Larger text")).not.toContain("disabled");
    const smallest = renderToString(
      <PlayView sheet={amazingGrace} textStep={-2} />,
    );
    expect(button(smallest, "Smaller text")).toContain("disabled");
    const largest = renderToString(
      <PlayView sheet={amazingGrace} textStep={3} />,
    );
    expect(button(largest, "Larger text")).toContain("disabled");
  });

  // Scenario "Printing from a phone": the menu shows on a phone only.
  it("has a menu for the text size and Print, also without chords", () => {
    const empty = {
      ...amazingGrace,
      content: { ...seedSong, sections: [{ lines: [] }] },
    };
    for (const sheet of [amazingGrace, empty]) {
      const html = renderToString(<PlayView sheet={sheet} />);
      expect(html).toMatch(
        /<div class="play-more">.*aria-label="More"[^>]*aria-haspopup="menu"/s,
      );
    }
  });

  it("leaves out the artist when there is none", () => {
    const withoutArtist = { ...amazingGrace, artist: undefined };
    expect(renderToString(<PlayView sheet={withoutArtist} />)).not.toContain(
      "play-artist",
    );
  });

  it("names the tab after the sheet and asks not to be indexed", () => {
    const tags = meta({
      loaderData: { sheet: amazingGrace, shownKey: null, capo: null },
    } as Route.MetaArgs);
    expect(tags).toEqual([
      { title: "Amazing Grace | Sheet Library" },
      { name: "robots", content: "noindex" },
    ]);
  });
});
