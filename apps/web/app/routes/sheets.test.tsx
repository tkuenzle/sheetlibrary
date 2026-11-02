import { renderToString } from "react-dom/server";
import { createRoutesStub, RouterContextProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { cloudflareContext, sessionContext } from "../context";
import { testEnv } from "../db/local-env.test-helper";
import { seedSong } from "../editor/seed-song";
import {
  createSheet,
  readSheet,
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

  const load = (userId: string | null) =>
    loader({ context: context(userId) } as unknown as Route.LoaderArgs);
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
    });
  });

  // Scenario "Not signed in".
  it("sends visitors who aren't signed in to sign-in", async () => {
    const response = (await load(null)) as Response;
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/sign-in");
  });

  it("creates an Untitled sheet and opens it", async () => {
    const response = await post("ana");
    expect(response.status).toBe(302);
    const id = /^\/sheets\/([\w-]+)$/.exec(
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
function render(sheets: SheetListItem[]) {
  const Stub = createRoutesStub([
    { path: "/", Component: () => <LibraryView sheets={sheets} /> },
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
      /<a [^>]*href="\/sheets\/abcdefghijkl">.*Hallelujah.*Leonard Cohen/,
    );
    expect(html).toContain('href="/sheets/mnopqrstuvwx"');
    expect(html.indexOf("Hallelujah")).toBeLessThan(
      html.indexOf("Amazing Grace"),
    );
    expect(html).toContain("New sheet");
    expect(html).not.toContain("No sheets yet");
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
  it("says there are no sheets yet, and offers a new one", () => {
    const html = render([]);
    expect(html).toContain("No sheets yet");
    expect(html).toMatch(/<form [^>]*method="post"[^>]*>.*New sheet<\/button>/);
    expect(html).not.toContain("<ul");
  });

  it("sets the page title and asks search engines not to index it", () => {
    expect(meta()).toContainEqual({ title: "Library | Sheet Library" });
    expect(meta()).toContainEqual({ name: "robots", content: "noindex" });
  });
});
