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
import {
  ConflictNote,
  loader,
  meta,
  NotFound,
  SaveStatus,
  SheetView,
} from "./sheet";

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

  function load(userId: string | null, id = sheet.id) {
    const context = new RouterContextProvider();
    context.set(cloudflareContext, { env: test.env });
    // Only the user's id matters here.
    const session = { user: { id: userId }, session: {} } as never;
    context.set(sessionContext, userId ? session : null);
    return loader({ context, params: { id } } as unknown as Route.LoaderArgs);
  }

  // Scenario "Opening a sheet".
  it("gives the owner their sheet", async () => {
    expect(await load("ana")).toEqual({ sheet });
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
    const html = renderToString(<SheetView sheet={amazingGrace} />);
    expect(html).toContain("<h1>Amazing Grace</h1>");
    expect(html).toContain("Key G");
    expect(html).toContain("How to edit");
  });

  it("has no prototype notice and no import", () => {
    const html = renderToString(<SheetView sheet={amazingGrace} />);
    expect(html).not.toContain("prototype");
    expect(html).not.toContain("Import");
  });

  it("starts out saved", () => {
    expect(renderToString(<SheetView sheet={amazingGrace} />)).toMatch(
      /<p class="save-status" role="status" data-state="saved">Saved<\/p>/,
    );
  });

  it("says whether the edits are saved", () => {
    const text = (state: Parameters<typeof SaveStatus>[0]["state"]) =>
      renderToString(<SaveStatus state={state} />);
    expect(text("waiting")).toContain("Saving…");
    expect(text("saving")).toContain("Saving…");
    expect(text("failed")).toContain("Not saved yet. Trying again…");
    expect(text("conflict")).toContain("Not saved");
  });

  it("says to reload when the sheet changed in another tab", () => {
    expect(renderToString(<ConflictNote />)).toContain(
      "This sheet changed in another tab. Reload to see it.",
    );
  });

  it("sets the page title and asks search engines not to index it", () => {
    const tags = meta({
      loaderData: { sheet: amazingGrace },
    } as Route.MetaArgs);
    expect(tags).toContainEqual({ title: "Amazing Grace | Sheet Library" });
    expect(tags).toContainEqual({ name: "robots", content: "noindex" });
  });

  it("says when the sheet isn't found", () => {
    expect(renderToString(<NotFound />)).toContain("<h1>Sheet not found</h1>");
    expect(
      meta({ loaderData: { sheet: null } } as Route.MetaArgs),
    ).toContainEqual({ title: "Sheet not found | Sheet Library" });
  });
});
