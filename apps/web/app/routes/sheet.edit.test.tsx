import type { Sheet } from "chordsheet";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { createRoutesStub, RouterContextProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { cloudflareContext, sessionContext } from "../context";
import { testEnv } from "../db/local-env.test-helper";
import { EditorHelp, FirstTimeHelp } from "../editor/help";
import { seedSong } from "../editor/seed-song";
import { createSheet, recentSheets } from "../sheets/sheets.server";
import { NotFound } from "../sheets/not-found";
import { addUser } from "../sheets/sheets.test-helper";
import type { Route } from "./+types/sheet.edit";
import {
  ConflictNote,
  DeletedNote,
  loader,
  meta,
  SaveStatus,
  SheetView,
} from "./sheet.edit";

// Edit mode inside a router, as on its page.
function render(view: ReactNode) {
  const Stub = createRoutesStub([
    { path: "/sheets/:id/edit", Component: () => view },
  ]);
  return renderToString(
    <Stub initialEntries={["/sheets/abcdefghijkl/edit"]} />,
  );
}

const amazingGrace: Sheet = {
  id: "abcdefghijkl",
  revision: 1,
  title: "Amazing Grace",
  content: seedSong,
};

describe("sheet page loader", () => {
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
    const url = new URL(`https://sheetlibrary.test/sheets/${id}/edit${search}`);
    const request = new Request(url, { headers: { Cookie: cookie } });
    return loader({
      context,
      params: { id },
      request,
      url,
    } as unknown as Route.LoaderArgs);
  }

  // Scenario "Opening a sheet".
  it("gives the owner their sheet", async () => {
    expect(await load("ana")).toEqual({
      sheet,
      isNew: false,
      shownKey: null,
      capo: null,
      helpSeen: false,
    });
  });

  // Scenario "Got it".
  it("passes on whether Got it put away the note on this device", async () => {
    expect(
      await load("ana", sheet.id, "", "play-text-size=1; edit-help=seen"),
    ).toMatchObject({ helpSeen: true });
  });

  // Scenario "Editing only" (library-page).
  it("doesn't count as opening the sheet", async () => {
    await load("ana");
    expect(await recentSheets(test.env.DB, "ana")).toEqual([]);
  });

  it("says when the sheet was just made with New sheet", async () => {
    expect(await load("ana", sheet.id, "?new")).toEqual({
      sheet,
      isNew: true,
      shownKey: null,
      capo: null,
      helpSeen: false,
    });
  });

  // Scenario "Reload in A".
  it("passes on the key to show the sheet in", async () => {
    expect(await load("ana", sheet.id, "?key=F%23m")).toMatchObject({
      shownKey: "F#m",
    });
  });

  // Scenario "Reload with capo 5".
  it("passes on the capo", async () => {
    expect(await load("ana", sheet.id, "?key=A&capo=5")).toMatchObject({
      shownKey: "A",
      capo: "5",
    });
  });

  // Scenario "Not signed in".
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

describe("sheet page", () => {
  it("shows the sheet's title as the heading, with the key and the help", () => {
    const html = render(<SheetView sheet={amazingGrace} />);
    expect(html).toMatch(/<h1><button [^>]*>Amazing Grace<\/button><\/h1>/);
    expect(html).toContain("Key G");
    expect(html).toContain('aria-label="How to edit"');
  });

  // Scenarios "Opening edit mode" and "Help on a wide screen".
  it("has Done, the save state, the help and the menu in the bar, and no help panel", () => {
    const html = render(<SheetView sheet={amazingGrace} />);
    expect(html).toMatch(
      /<header class="top-bar sheet-bar sheet-bar-edit">.*Done<\/button><p class="save-status".*aria-label="How to edit".*aria-label="More for this sheet".*<\/header>/s,
    );
    expect(html).toContain("side-panel-button-every-width");
    expect(html).not.toContain('class="side-panel"');
    expect(html).not.toContain('aria-label="Back"');
    expect(html).not.toContain('aria-label="Account"');
  });

  // Scenario "Opening a sheet".
  it("shows the artist below the title", () => {
    const html = render(
      <SheetView sheet={{ ...amazingGrace, artist: "Chris Tomlin" }} />,
    );
    expect(html).toMatch(/<\/h1>.*>Chris Tomlin<\/button>/s);
    expect(html).not.toContain("Add artist");
  });

  // Scenario "Renaming with the button".
  it("has Rename beside the title, disabled while read-only", () => {
    const html = render(<SheetView sheet={amazingGrace} />);
    expect(html).toMatch(/<\/h1><span[^>]*><button [^>]*aria-label="Rename"/);
    expect(
      /<button [^>]*aria-label="Rename"[^>]*>/.exec(html)?.[0],
    ).not.toContain("disabled");
  });

  it("has no Rename beside the field while the title is open", () => {
    expect(render(<SheetView sheet={amazingGrace} isNew />)).not.toContain(
      'aria-label="Rename"',
    );
  });

  it("offers to add an artist when there is none", () => {
    expect(render(<SheetView sheet={amazingGrace} />)).toContain("Add artist");
  });

  it("has the sheet's menu", () => {
    const html = render(<SheetView sheet={amazingGrace} />);
    expect(html).toContain('aria-label="More for this sheet"');
    expect(html).toContain('aria-haspopup="menu"');
  });

  it("has the delete and the leave dialogs, closed", () => {
    const html = render(<SheetView sheet={amazingGrace} />);
    expect(
      html.match(/<dialog [^>]*role="alertdialog"[^>]*><\/dialog>/g),
    ).toHaveLength(2);
  });

  // Scenario "Got it".
  it("shows the first-time note until Got it put it away", () => {
    const first = render(<SheetView sheet={amazingGrace} />);
    expect(first).toMatch(
      /<div class="editor-intro"><div class="first-time-help" role="note">/,
    );
    expect(render(<SheetView sheet={amazingGrace} helpSeen />)).not.toContain(
      "first-time-help",
    );
  });

  it("says how to edit for touch and a mouse, with its two buttons", () => {
    const html = renderToString(
      <FirstTimeHelp onShortcuts={() => undefined} onGotIt={() => undefined} />,
    );
    expect(html).toContain(
      '<span class="help-touch">Tap a section to edit it.',
    );
    expect(html).toContain(
      '<span class="help-mouse">Click a section to edit it. <kbd>Ctrl K</kbd> or <kbd>⌘ K</kbd> adds a chord at the cursor.</span>',
    );
    expect(html).toMatch(/All shortcuts<\/button>.*Got it<\/button>/);
  });

  it("opens the title field for a new sheet", () => {
    const html = render(<SheetView sheet={amazingGrace} isNew />);
    expect(html).toMatch(/<h1><input [^>]*aria-label="Title"/);
    expect(html).toContain('value="Amazing Grace"');
  });

  // Scenario "Help on the sheet page".
  it("says how to rename in the help", () => {
    const html = renderToString(<EditorHelp rename />);
    expect(html).toContain("Click the title to rename the sheet");
    expect(html).toContain("Tap the title to rename the sheet");
  });

  it("has no prototype notice and no import", () => {
    const html = render(<SheetView sheet={amazingGrace} />);
    expect(html).not.toContain("prototype");
    expect(html).not.toContain("Import");
  });

  it("starts out saved", () => {
    expect(render(<SheetView sheet={amazingGrace} />)).toMatch(
      /<p class="save-status" role="status" data-state="saved">Saved<\/p>/,
    );
  });

  it("says whether the edits are saved", () => {
    const text = (shown: Parameters<typeof SaveStatus>[0]["shown"]) =>
      renderToString(<SaveStatus shown={shown} />);
    expect(text("saved")).toContain("Saved");
    expect(text("saving")).toContain("Saving…");
    expect(text("failed")).toContain("Not saved yet. Trying again…");
    expect(text("conflict")).toContain("Not saved");
    expect(text("deleted")).toContain("Not saved");
    // Scenario "Typing": nothing while edits wait.
    expect(text(null)).toBe('<p class="save-status" role="status"></p>');
  });

  it("says to reload when the sheet changed in another tab", () => {
    expect(renderToString(<ConflictNote />)).toContain(
      "This sheet changed in another tab. Reload to see it.",
    );
  });

  // Scenario "Deleted in another tab".
  it("says the sheet was deleted and links to the library", () => {
    const html = renderToString(<DeletedNote />);
    expect(html).toContain("This sheet was deleted.");
    expect(html).toMatch(/<a href="\/sheets">Back to library<\/a>/);
  });

  it("sets the page title and asks search engines not to index it", () => {
    const tags = meta({
      loaderData: { sheet: amazingGrace },
    } as Route.MetaArgs);
    expect(tags).toContainEqual({ title: "Amazing Grace | Sheet Library" });
    expect(tags).toContainEqual({ name: "robots", content: "noindex" });
  });

  it("says when the sheet isn't found", () => {
    expect(render(<NotFound />)).toContain("<h1>Sheet not found</h1>");
    expect(
      meta({ loaderData: { sheet: null } } as Route.MetaArgs),
    ).toContainEqual({ title: "Sheet not found | Sheet Library" });
  });
});
