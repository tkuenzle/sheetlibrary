import { renderToString } from "react-dom/server";
import { createRoutesStub } from "react-router";
import { describe, expect, it } from "vitest";

import type { CollectionListItem } from "../collections/collections";
import { CollectionsView, meta } from "./collections";

// The shell loads the collections (see shell.test.tsx).

function render(collections: CollectionListItem[]) {
  const Stub = createRoutesStub([
    {
      path: "/collections",
      Component: () => (
        <CollectionsView
          collections={collections}
          onCreated={() => undefined}
        />
      ),
    },
  ]);
  return renderToString(<Stub initialEntries={["/collections"]} />);
}

describe("Collections screen", () => {
  // Requirement "My collections".
  it("shows each collection as a card with its count, linking to its page", () => {
    const html = render([
      { id: "abcdefghijkl", name: "Christmas", count: 14, titles: [] },
      { id: "mnopqrstuvwx", name: "Learning", count: 1, titles: [] },
    ]);
    expect(html).toContain('<ul class="collections-cards">');
    expect(html).toMatch(
      /<a [^>]*href="\/collections\/abcdefghijkl"[^>]*>.*Christmas.*14 sheets/,
    );
    expect(html).toMatch(
      /<a [^>]*href="\/collections\/mnopqrstuvwx"[^>]*>.*1 sheet</,
    );
    expect(html.indexOf("Christmas")).toBeLessThan(html.indexOf("Learning"));
  });

  // Scenario "First titles on a card".
  it("shows a collection's first titles on its card", () => {
    const html = render([
      {
        id: "abcdefghijkl",
        name: "Christmas",
        count: 4,
        titles: ["Die Könige", "Drüü Könige", "O Tannenbaum"],
      },
      { id: "mnopqrstuvwx", name: "Campfire", count: 0, titles: [] },
    ]);
    expect(html).toContain(
      '<span class="collections-titles">Die Könige, Drüü Könige, O Tannenbaum</span>',
    );
    expect(html.match(/collections-titles/g)).toHaveLength(1);
  });

  // Scenario "Opening Collections".
  it("is headed Collections, with New collection and no Import or New sheet", () => {
    for (const collections of [
      [{ id: "abcdefghijkl", name: "Christmas", count: 0, titles: [] }],
      [],
    ]) {
      const html = render(collections);
      expect(html).toMatch(
        /^<div class="library[^"]*">.*<h1>Collections<\/h1>/s,
      );
      expect(html).toContain("New collection");
      expect(html).not.toContain("New sheet");
      expect(html).not.toContain("Import");
      expect(html).not.toContain("Library</h1>");
      expect(html).not.toContain("<nav");
    }
  });

  // Scenario "First visit".
  it("says there are no collections yet, and offers New collection", () => {
    const html = render([]);
    expect(html).toContain("No collections yet");
    expect(html).toMatch(/No collections yet.*New collection/s);
    expect(html).not.toContain("collections-cards");
  });

  it("sets the page title and asks search engines not to index it", () => {
    expect(meta()).toContainEqual({ title: "Collections | Sheet Library" });
    expect(meta()).toContainEqual({ name: "robots", content: "noindex" });
  });
});
