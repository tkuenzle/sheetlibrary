import type { Sheet } from "chordsheet";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { createRoutesStub, RouterContextProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  ChooseCollectionsDialog,
  CollectionChoices,
} from "../collections/choose-collections-dialog";
import { createCollection } from "../collections/collections.server";
import { cloudflareContext, sessionContext } from "../context";
import { testEnv } from "../db/local-env.test-helper";
import { seedSong } from "../editor/seed-song";
import {
  createSheet,
  createVersion,
  recentSheets,
} from "../sheets/sheets.server";
import { addUser } from "../sheets/sheets.test-helper";
import type { Route } from "./+types/sheet";
import { loader, meta, PlaySkeleton, PlayView } from "./sheet";

// The play view inside a router, as on its page.
function render(view: ReactNode) {
  const Stub = createRoutesStub([
    { path: "/sheets/:id", Component: () => view },
  ]);
  return renderToString(<Stub initialEntries={["/sheets/abcdefghijkl"]} />);
}

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
      collections: [],
      versionId: null,
      shownKey: "A",
      capo: "2",
      lyricsOnly: false,
      textStep: 0,
    });
  });

  // Scenario "In two collections".
  it("gives the collections that hold the sheet, A to Z", async () => {
    for (const name of ["Christmas", "Campfire"]) {
      await createCollection(test.env.DB, "ana", { name, sheetId: sheet.id });
    }
    await createCollection(test.env.DB, "ana", { name: "Kinderlieder" });
    const loaded = (await load("ana")) as { collections: { name: string }[] };
    expect(loaded.collections.map((c) => c.name)).toEqual([
      "Campfire",
      "Christmas",
    ]);
  });

  // Scenario "Opened last" (library-page).
  it("notes that the owner opened the sheet", async () => {
    await load("ana");
    expect(await recentSheets(test.env.DB, "ana")).toMatchObject([
      { id: sheet.id },
    ]);
  });

  it("notes nothing for someone else's sheet or an unknown id", async () => {
    await load("bo");
    await load("ana", "unknownid123");
    expect(await recentSheets(test.env.DB, "ana")).toEqual([]);
    expect(await recentSheets(test.env.DB, "bo")).toEqual([]);
  });

  it("still opens the sheet when the opening can't be noted", async () => {
    await test.env.DB.prepare('DROP TABLE "sheet_open"').run();
    expect(await load("ana")).toMatchObject({ sheet });
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
    const html = render(<PlayView sheet={amazingGrace} />);
    expect(html).toContain("<h1>Amazing Grace</h1>");
    expect(html).toContain('<p class="play-artist">John Newton</p>');
    expect(html).toContain('<div class="sheet-view-label">Verse 1</div>');
  });

  it("has no editor, save state or help", () => {
    const html = render(<PlayView sheet={amazingGrace} />);
    expect(html).not.toContain("contenteditable");
    expect(html).not.toContain('role="status"');
    expect(html).not.toContain("How to edit");
  });

  it("shows the lyrics larger than the editor", () => {
    const html = render(<PlayView sheet={amazingGrace} />);
    expect(html).toContain("--sheet-view-font-size:var(--play-text-base)");
  });

  it("shows the sheet in the key the address holds", () => {
    const html = render(<PlayView sheet={amazingGrace} shownKey="A" />);
    expect(html).toContain('<span class="sheet-view-chord">A7</span>');
    expect(html).not.toContain('<span class="sheet-view-chord">G7</span>');
    expect(html).toMatch(/Key <!-- -->A/);
  });

  it("shows the shapes for the capo the address holds", () => {
    const html = render(<PlayView sheet={amazingGrace} capo="2" />);
    expect(html).toContain('<span class="sheet-view-chord">F7</span>');
    expect(html).toContain('<span class="sheet-view-chord">Bb</span>');
  });

  // Scenario "Opened in another key": in A with capo 2, the shapes are G.
  it("shows a key and a capo together", () => {
    const html = render(
      <PlayView sheet={amazingGrace} shownKey="A" capo="2" />,
    );
    expect(html).toContain('aria-label="Key A, 2 semitones up"');
    expect(html).toContain("Capo 2, G shapes");
    expect(html).toContain('<span class="sheet-view-chord">G7</span>');
  });

  // Scenario "Transposing to play".
  it("offers the key panel to view only", () => {
    const html = render(<PlayView sheet={amazingGrace} />);
    expect(html).toContain('class="key-button-toggle"');
    expect(html).toContain("Capo");
  });

  it("has no key or capo for a sheet without chords", () => {
    const empty = {
      ...amazingGrace,
      content: { ...seedSong, sections: [{ lines: [] }] },
    };
    expect(render(<PlayView sheet={empty} />)).not.toContain("key-button");
  });

  // Scenario "From playing to editing".
  it("links Edit to edit mode, carrying the key and the capo", () => {
    const html = render(
      <PlayView sheet={amazingGrace} shownKey="F#" capo="1" />,
    );
    expect(html).toMatch(
      /<a [^>]*aria-label="Edit" href="\/sheets\/abcdefghijkl\/edit\?key=F%23&amp;capo=1"/,
    );
    expect(html).not.toContain('aria-label="Play"');
  });

  // Scenario "On a wide screen".
  it("has Back, View, Edit and the sheet's menu in the top bar", () => {
    const html = render(<PlayView sheet={amazingGrace} />);
    const names = [
      ...html.matchAll(
        /<(?:a|button) [^>]*aria-label="(Back|View|Edit|More for this sheet)"/g,
      ),
    ].map((m) => m[1]);
    expect(names).toEqual(["Back", "View", "Edit", "More for this sheet"]);
    expect(html).not.toContain('aria-label="Account"');
  });

  it("shows the text size this device keeps", () => {
    const html = render(<PlayView sheet={amazingGrace} textStep={1} />);
    expect(html).toContain(
      "--sheet-view-font-size:calc(var(--play-text-base) * 1.15)",
    );
  });

  // Scenario "Lyrics only from View": the text size, then the switch.
  it("has the text size and Lyrics only in View", () => {
    const html = render(<PlayView sheet={amazingGrace} textStep={1} />);
    expect(html).toMatch(
      /<dialog [^>]*aria-label="View".*aria-label="Smaller text".*115%.*aria-label="Larger text".*role="switch"/s,
    );
  });

  it("disables Smaller text and Larger text at the ends", () => {
    const button = (html: string, label: string) =>
      new RegExp(`aria-label="${label}"[^>]*>`).exec(html)?.[0] ?? "";
    const middle = render(<PlayView sheet={amazingGrace} />);
    expect(button(middle, "Smaller text")).not.toContain("disabled");
    expect(button(middle, "Larger text")).not.toContain("disabled");
    const smallest = render(<PlayView sheet={amazingGrace} textStep={-2} />);
    expect(button(smallest, "Smaller text")).toContain("disabled");
    const largest = render(<PlayView sheet={amazingGrace} textStep={3} />);
    expect(button(largest, "Larger text")).toContain("disabled");
  });

  // Scenario "Printing from the menu": the items are in sheets/sheet-menu.
  it("has the sheet's menu, also without chords", () => {
    const empty = {
      ...amazingGrace,
      content: { ...seedSong, sections: [{ lines: [] }] },
    };
    for (const sheet of [amazingGrace, empty]) {
      const html = render(<PlayView sheet={sheet} />);
      expect(html).toMatch(
        /aria-label="More for this sheet"[^>]*aria-haspopup="menu"/,
      );
      expect(html).not.toContain('aria-label="More"');
    }
  });

  // Scenario "In two collections".
  it("links the collections that hold the sheet under the title", () => {
    const html = render(
      <PlayView
        sheet={amazingGrace}
        collections={[
          { id: "c1", name: "Campfire" },
          { id: "c2", name: "Christmas" },
        ]}
      />,
    );
    expect(html).toMatch(
      /<ul class="play-collections" aria-label="Collections"><li><a [^>]*href="\/collections\/c1"[^>]*>.*Campfire<\/a><\/li><li><a [^>]*href="\/collections\/c2"/,
    );
    expect(html.indexOf("key-button")).toBeLessThan(
      html.indexOf("play-collections"),
    );
  });

  it("shows no collections when none holds the sheet", () => {
    expect(render(<PlayView sheet={amazingGrace} />)).not.toContain(
      "play-collections",
    );
  });

  describe("choose collections", () => {
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

    // Requirement "Bars in the dialogs that load".
    it("shows rows of bars while the collections load", () => {
      const html = renderToString(
        <CollectionChoices
          loaded={{ kind: "loading" }}
          onToggle={() => undefined}
        />,
      );
      expect(html).not.toContain("Loading collections");
      expect(html).toContain('aria-busy="true"');
      expect(html.match(/choose-collections-skeleton/g)).toHaveLength(5);
      expect(html).toContain("skeleton-bar skeleton-bar-box");
    });

    it("lets New collection wait for the list, and Done close", () => {
      const Stub = createRoutesStub([
        {
          path: "/",
          Component: () => (
            <ChooseCollectionsDialog
              open
              sheet={{ id: "abcdefghijkl", title: "Amazing Grace" }}
              onClose={() => undefined}
            />
          ),
        },
      ]);
      const html = renderToString(<Stub />);
      expect(html).toMatch(
        /<button[^>]*disabled=""[^>]*>.*?New collection<\/button>/,
      );
      expect(html).toMatch(
        /<button type="button" class="button button-filled">Done<\/button>/,
      );
    });
  });

  describe("lyrics only", () => {
    const toggle = (html: string) =>
      /<button[^>]*role="switch"[^>]*>/.exec(html)?.[0] ?? "";

    // Scenario "Opened with lyrics only".
    it("shows the lyrics without chords or the key and capo buttons", () => {
      const html = render(
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
      const html = render(<PlayView sheet={amazingGrace} />);
      expect(html).toContain('class="sheet-view-chord"');
      expect(html).toContain("key-button");
    });

    it("has a switch in View, on while on", () => {
      const off = render(<PlayView sheet={amazingGrace} />);
      expect(toggle(off)).toContain('aria-checked="false"');
      const on = render(<PlayView sheet={amazingGrace} lyricsOnly />);
      expect(toggle(on)).toContain('aria-checked="true"');
    });

    it("isn't carried to the editor, but the key is", () => {
      const html = render(
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
      const html = render(
        <PlayView
          sheet={amazingGrace}
          versions={versions}
          versionId={anna.id}
        />,
      );
      expect(html).toContain('<span class="sheet-view-chord">A7</span>');
      expect(html).toMatch(/aria-label="Key A, Anna&#x27;s key"/);
      expect(html).not.toContain("data-transposed");
    });

    // Scenario "Version in another key".
    it("shows another key with the version still open", () => {
      const html = render(
        <PlayView
          sheet={amazingGrace}
          versions={versions}
          versionId={anna.id}
          shownKey="Bb"
        />,
      );
      expect(html).toContain('<span class="sheet-view-chord">Bb7</span>');
      expect(html).toContain(
        'aria-label="Key B flat, 1 semitone up, Anna&#x27;s key"',
      );
    });

    // Scenario "Name in the key button".
    it("shows the version's name in the key button, and the artist alone", () => {
      const html = render(
        <PlayView
          sheet={amazingGrace}
          versions={versions}
          versionId={anna.id}
        />,
      );
      expect(html).toMatch(
        /Key <!-- -->A<span class="key-button-version"> · <!-- -->Anna&#x27;s key<\/span>/,
      );
      // On paper the name follows the artist; on screen CSS hides it there.
      expect(html).toContain(
        '<p class="play-artist">John Newton<span class="play-print-version"> · Anna&#x27;s key</span></p>',
      );
    });

    // Scenario "Printing a version".
    it("keeps the version's name for printing, also without an artist", () => {
      const alone = render(
        <PlayView
          sheet={{ ...amazingGrace, artist: undefined }}
          versions={versions}
          versionId={anna.id}
        />,
      );
      expect(alone).toContain(
        '<p class="play-artist"><span class="play-print-version">Anna&#x27;s key</span></p>',
      );
    });

    it("shows no name without an open version", () => {
      const html = render(
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
      const html = render(
        <PlayView sheet={minorSheet} versions={versions} versionId={anna.id} />,
      );
      expect(html).toMatch(/aria-label="Key F sharp minor, Anna&#x27;s key"/);
    });

    // "Edit" from a version opens the editor in its key.
    it("carries the version's key to the editor", () => {
      const html = render(
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
    expect(render(<PlayView sheet={withoutArtist} />)).not.toContain(
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

function renderSkeleton(state: unknown, search = "") {
  const Stub = createRoutesStub([
    {
      path: "/sheets/:id",
      Component: () => <PlaySkeleton sheetId="stille000000" />,
    },
  ]);
  return renderToString(
    <Stub
      initialEntries={[{ pathname: "/sheets/stille000000", search, state }]}
    />,
  );
}

// Requirement "What the skeleton already knows".
describe("play view while the sheet loads", () => {
  it("shows the row's title and artist, and bars for the chips and lines", () => {
    const html = renderSkeleton({
      openedFrom: "list",
      title: "Stille Nacht",
      artist: "Franz Xaver Gruber",
    });
    expect(html).toMatch(/<h1[^>]*>Stille Nacht<\/h1>/);
    expect(html).toMatch(/<p class="play-artist">Franz Xaver Gruber<\/p>/);
    expect(html).toContain("skeleton-bar-chip");
    expect(html).toContain('class="sheet-view"');
    expect(html).toContain('aria-busy="true"');
  });

  it("shows bars for the title and artist without a row", () => {
    const html = renderSkeleton(null);
    expect(html).toMatch(/<h1[^>]*><span class="skeleton-bar"/);
    expect(html).toMatch(/<p class="play-artist"><span class="skeleton-bar"/);
  });

  it("has no artist line for a row without an artist", () => {
    const html = renderSkeleton({ openedFrom: "recent", title: "Sternsinger" });
    expect(html).not.toContain("play-artist");
  });

  it("shows lyrics only without chips or chords", () => {
    const html = renderSkeleton({ title: "Stille Nacht" }, "?lyrics");
    expect(html).not.toContain("skeleton-bar-chip");
    expect(html).toContain("is-lyrics-only");
    expect(html).not.toContain("sheet-view-chord");
  });

  it("lets Back and Edit work, and View and the menu wait", () => {
    const html = renderSkeleton({ title: "Stille Nacht" });
    expect(html).toMatch(/href="\/sheets\/stille000000\/edit"/);
    expect(html).toMatch(
      /aria-label="View"[^>]*disabled=""|disabled=""[^>]*aria-label="View"/,
    );
  });

  it("names the page from the row while the sheet loads", () => {
    const named = meta({
      loaderData: { page: new Promise(() => undefined) },
      location: { state: { openedFrom: "list", title: "Stille Nacht" } },
    } as unknown as Route.MetaArgs);
    expect(named).toContainEqual({ title: "Stille Nacht | Sheet Library" });
  });
});
