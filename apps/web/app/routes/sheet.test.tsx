import type { Sheet } from "chordsheet";
import { renderToString } from "react-dom/server";
import { RouterContextProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { CollectionChoices } from "../collections/add-to-collection-dialog";
import { cloudflareContext, sessionContext } from "../context";
import { testEnv } from "../db/local-env.test-helper";
import { seedSong } from "../editor/seed-song";
import { createSheet, createVersion } from "../sheets/sheets.server";
import { addUser } from "../sheets/sheets.test-helper";
import type { Route } from "./+types/sheet";
import { loader, meta, phoneMenuItems, PlayView } from "./sheet";

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
      versions: [],
      versionId: null,
      shownKey: "A",
      capo: "2",
      lyricsOnly: false,
      textStep: 0,
    });
  });

  // Scenario "Opened with lyrics only".
  it("passes on lyrics only, with or without a value", async () => {
    for (const search of ["?lyrics&key=A", "?key=A&lyrics=", "?lyrics=1"]) {
      expect(await load("ana", sheet.id, search)).toMatchObject({
        lyricsOnly: true,
      });
    }
  });

  // Scenario "Larger on this device".
  it("passes on this device's text size", async () => {
    expect(await load("ana", sheet.id, "", "play-text-size=2")).toMatchObject({
      textStep: 2,
    });
  });

  async function saveVersion(name: string, key: string) {
    const result = await createVersion(test.env.DB, "ana", sheet.id, {
      name,
      key,
    });
    if (result.kind !== "saved") throw new Error(result.kind);
    return result.version;
  }

  // Scenario "Link to a version".
  it("gives the sheet's versions and the one the address opens", async () => {
    const anna = await saveVersion("Anna's key", "A");
    const band = await saveVersion("Sunday band", "Bb");
    expect(
      await load("ana", sheet.id, `?version=${anna.id}&key=Bb`),
    ).toMatchObject({
      versions: [anna, band],
      versionId: anna.id,
      shownKey: "Bb",
    });
  });

  // Scenario "Bookmark after deleting".
  it("leads a version that is gone to the sheet, keeping capo and lyrics", async () => {
    const response = (await load(
      "ana",
      sheet.id,
      "?version=AAAAAAAAAAAA&key=Bb&capo=2&lyrics",
    )) as Response;
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(
      `/sheets/${sheet.id}?capo=2&lyrics`,
    );
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

  describe("add to collection", () => {
    // Scenario "On a wide screen".
    it("has a button in the top bar before Smaller text", () => {
      const html = renderToString(<PlayView sheet={amazingGrace} />);
      expect(html).toMatch(
        /play-actions-divider.*aria-label="Add to collection".*aria-label="Smaller text"/s,
      );
    });

    // Scenario "Adding from a phone".
    it("is in the phone's menu after Lyrics only, before the text size", () => {
      const item = (label: string, separated?: boolean) => ({
        label,
        icon: "add" as const,
        ...(separated === undefined ? {} : { separated }),
        onSelect: () => undefined,
      });
      expect(
        phoneMenuItems(item("Lyrics only", true), item("Add to collection…"), [
          item("Smaller text"),
          item("Print"),
        ]).map((i) => [i.label, i.separated ?? false]),
      ).toEqual([
        ["Lyrics only", false],
        ["Add to collection…", true],
        ["Smaller text", false],
        ["Print", false],
      ]);
    });

    // Scenario "Already in a collection".
    it("ticks the collections that hold the sheet", () => {
      const html = renderToString(
        <CollectionChoices
          loaded={{
            kind: "loaded",
            collections: [
              { id: "c1", name: "Christmas", holds: false },
              { id: "c2", name: "Kinderlieder", holds: true },
            ],
          }}
          onToggle={() => undefined}
        />,
      );
      expect(html).toMatch(
        /<fieldset[^>]*aria-label="Collections"><label><input type="checkbox"\/><span>Christmas<\/span><\/label><label><input type="checkbox" checked=""\/><span>Kinderlieder<\/span>/,
      );
    });

    it("says so when there are no collections or they couldn't load", () => {
      const none = renderToString(
        <CollectionChoices
          loaded={{ kind: "loaded", collections: [] }}
          onToggle={() => undefined}
        />,
      );
      expect(none).toContain("No collections yet");
      const failed = renderToString(
        <CollectionChoices
          loaded={{ kind: "failed" }}
          onToggle={() => undefined}
        />,
      );
      expect(failed).toContain("The collections couldn’t be loaded.");
    });
  });

  describe("lyrics only", () => {
    const toggle = (html: string) =>
      /<button[^>]*class="[^"]*play-lyrics-toggle"[^>]*>/.exec(html)?.[0] ?? "";

    // Scenario "Opened with lyrics only".
    it("shows the lyrics without chords or the key and capo buttons", () => {
      const html = renderToString(
        <PlayView sheet={amazingGrace} shownKey="A" lyricsOnly />,
      );
      expect(html).toContain("sheet-view is-lyrics-only");
      expect(html).toContain("Amazing grace, how sweet the sound");
      expect(html).not.toContain('class="sheet-view-chord"');
      expect(html).not.toContain("key-button");
      expect(html).not.toContain("Capo");
    });

    // Scenario "Turning chords off and on": off, nothing changes.
    it("shows the chords and the key button when off", () => {
      const html = renderToString(<PlayView sheet={amazingGrace} />);
      expect(html).toContain('class="sheet-view-chord"');
      expect(html).toContain("key-button");
      expect(html).not.toContain("play-lyrics-label");
    });

    it("has a toggle in the top bar, pressed while on", () => {
      const off = renderToString(<PlayView sheet={amazingGrace} />);
      expect(toggle(off)).toContain('aria-pressed="false"');
      const on = renderToString(<PlayView sheet={amazingGrace} lyricsOnly />);
      expect(toggle(on)).toContain('aria-pressed="true"');
      expect(on).toMatch(/play-lyrics-toggle".*?<\/svg>Lyrics only<\/button>/s);
    });

    it("comes before the text size", () => {
      const html = renderToString(<PlayView sheet={amazingGrace} />);
      expect(html.indexOf("play-lyrics-toggle")).toBeLessThan(
        html.indexOf('aria-label="Smaller text"'),
      );
    });

    // Scenario "On a phone": the label shows on a phone only.
    it("shows a label in place of the key and capo buttons", () => {
      const html = renderToString(<PlayView sheet={amazingGrace} lyricsOnly />);
      expect(html).toMatch(
        /<h1>Amazing Grace<\/h1><div class="play-more"><span class="play-lyrics-label">Lyrics only<\/span>/,
      );
    });

    it("isn't carried to the editor, but the key is", () => {
      const html = renderToString(
        <PlayView sheet={amazingGrace} shownKey="A" lyricsOnly />,
      );
      expect(html).toContain('href="/sheets/abcdefghijkl/edit?key=A"');
    });
  });

  describe("versions", () => {
    const anna = { id: "anna12345678", name: "Anna's key", key: "A" };
    const band = { id: "band12345678", name: "Sunday band", key: "Bb" };
    const versions = [anna, band];

    // Scenario "Link to a version".
    it("shows the sheet in the open version's key", () => {
      const html = renderToString(
        <PlayView
          sheet={amazingGrace}
          versions={versions}
          versionId={anna.id}
        />,
      );
      expect(html).toContain('<span class="sheet-view-chord">A7</span>');
      expect(html).toMatch(/aria-label="Key A"/);
      expect(html).not.toContain("data-transposed");
    });

    // Scenario "Version in another key".
    it("shows another key with the version still open", () => {
      const html = renderToString(
        <PlayView
          sheet={amazingGrace}
          versions={versions}
          versionId={anna.id}
          shownKey="Bb"
        />,
      );
      expect(html).toContain('<span class="sheet-view-chord">Bb7</span>');
      expect(html).toContain('aria-label="Key B flat, 1 semitone up"');
      expect(html).toContain("John Newton · Anna&#x27;s key");
    });

    // Scenario "Name after the artist".
    it("shows the version's name after the artist, or alone", () => {
      const html = renderToString(
        <PlayView
          sheet={amazingGrace}
          versions={versions}
          versionId={anna.id}
        />,
      );
      expect(html).toContain(
        '<p class="play-artist">John Newton · Anna&#x27;s key</p>',
      );
      const alone = renderToString(
        <PlayView
          sheet={{ ...amazingGrace, artist: undefined }}
          versions={versions}
          versionId={anna.id}
        />,
      );
      expect(alone).toContain('<p class="play-artist">Anna&#x27;s key</p>');
    });

    it("shows the version's name with lyrics only", () => {
      const html = renderToString(
        <PlayView
          sheet={amazingGrace}
          versions={versions}
          versionId={anna.id}
          lyricsOnly
        />,
      );
      expect(html).toContain("John Newton · Anna&#x27;s key");
    });

    it("shows no name without an open version", () => {
      const html = renderToString(
        <PlayView sheet={amazingGrace} versions={versions} />,
      );
      expect(html).toContain('<p class="play-artist">John Newton</p>');
    });

    // Scenario "Song key set to minor" (sheet-versions).
    it("shows a major version on a minor sheet in its relative key", () => {
      const minorSheet = {
        ...amazingGrace,
        content: { ...seedSong, key: { tonic: "E", minor: true } },
      };
      const html = renderToString(
        <PlayView sheet={minorSheet} versions={versions} versionId={anna.id} />,
      );
      expect(html).toMatch(/aria-label="Key F sharp minor"/);
    });

    // "Edit" from a version opens the editor in its key.
    it("carries the version's key to the editor", () => {
      const html = renderToString(
        <PlayView
          sheet={amazingGrace}
          versions={versions}
          versionId={anna.id}
        />,
      );
      expect(html).toContain('href="/sheets/abcdefghijkl/edit?key=A"');
    });
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
