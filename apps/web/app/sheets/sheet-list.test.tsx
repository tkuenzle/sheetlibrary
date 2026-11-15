import { renderToString } from "react-dom/server";
import { createRoutesStub } from "react-router";
import { describe, expect, it } from "vitest";

import type { SheetOrder } from "./order";
import {
  failureNote,
  type ListSheet,
  rowMenuItems,
  SheetList,
} from "./sheet-list";

const today = Date.now();
const sheets: ListSheet[] = [
  {
    id: "stille000000",
    title: "Stille Nacht",
    artist: "Franz Xaver Gruber",
    key: "F#m",
    updatedAt: Date.UTC(2025, 8, 3, 12),
    addedAt: today,
  },
  {
    id: "grace0000000",
    title: "Amazing Grace",
    updatedAt: today,
    addedAt: Date.UTC(2025, 1, 1),
  },
];

// The list needs a router for its links and fetchers.
function render(
  props: {
    order?: SheetOrder;
    sorted?: boolean;
    collection?: { id: string; name: string };
  } = {},
) {
  const Stub = createRoutesStub([
    {
      path: "/",
      Component: () => (
        <SheetList
          sheets={sheets}
          order={props.order ?? "title"}
          sorted={props.sorted}
          collection={props.collection}
          onGone={() => undefined}
        />
      ),
    },
  ]);
  return renderToString(<Stub />);
}

describe("the sheet list", () => {
  // Requirement "A row in the list".
  it("shows each sheet's title, artist and key, opening it to play", () => {
    const html = render();
    expect(html).toMatch(
      /<a class="library-columns" [^>]*href="\/sheets\/stille000000"[^>]*>.*Stille Nacht.*Franz Xaver Gruber.*<span class="library-key"><span aria-hidden="true">F#m<\/span><span class="visually-hidden">F sharp minor<\/span><\/span>/,
    );
    expect(html).toMatch(/<span>Title<\/span><span>Artist<\/span><span>Key/);
    expect(html).not.toContain("3 Sep 2025");
  });

  // Scenario "No chords".
  it("shows no key, and no separator, for a sheet without one", () => {
    const html = render();
    expect(html).toMatch(
      /href="\/sheets\/grace0000000"[^>]*>.*Amazing Grace.*<span class="library-key"><\/span>/,
    );
    expect(html.match(/library-separator/g)).toHaveLength(1);
  });

  // Scenario "A to Z by default".
  it("sorts A to Z by default, and names the order on its control", () => {
    const html = render();
    expect(html.indexOf("Amazing Grace")).toBeLessThan(
      html.indexOf("Stille Nacht"),
    );
    expect(html).toMatch(
      /class="button button-text menu-toggle-text" aria-haspopup="menu"[^>]*>.*Title<svg/,
    );
  });

  // Scenario "From Sheets to a collection".
  it("starts in the order this device keeps", () => {
    const html = render({ order: "added" });
    expect(html.indexOf("Stille Nacht")).toBeLessThan(
      html.indexOf("Amazing Grace"),
    );
    expect(html).toMatch(/Last added<svg/);
  });

  // Scenario "Searching".
  it("keeps the sheets as given, without the control, while searching", () => {
    const html = render({ order: "title", sorted: false });
    expect(html.indexOf("Stille Nacht")).toBeLessThan(
      html.indexOf("Amazing Grace"),
    );
    expect(html).not.toContain("menu-toggle-text");
  });

  // Requirement "The menu on a row".
  it("has a menu button on each row, named for the sheet", () => {
    const html = render();
    expect(html).toContain('aria-label="More for Stille Nacht"');
    expect(html).toContain('aria-label="More for Amazing Grace"');
    expect(html).not.toContain("Remove Stille Nacht");
  });

  it("has an empty place for a note, read out when one shows", () => {
    expect(render()).toContain(
      '<div class="sheet-list-status" role="status"></div>',
    );
  });
});

describe("a row's menu", () => {
  const handlers = {
    onChoose: () => undefined,
    onRemove: () => undefined,
    onDelete: () => undefined,
  };

  // Scenario "On Sheets".
  it("offers Choose collections… and Delete", () => {
    const items = rowMenuItems(handlers);
    expect(items.map((item) => item.label)).toEqual([
      "Choose collections…",
      "Delete",
    ]);
    expect(items[0]?.separated).toBe(true);
  });

  // Scenario "In a collection".
  it("adds Remove from the collection before Delete", () => {
    expect(
      rowMenuItems({ ...handlers, collection: { name: "Christmas" } }).map(
        (item) => item.label,
      ),
    ).toEqual(["Choose collections…", "Remove from Christmas", "Delete"]);
  });

  it("has no Edit, Rename or Print", () => {
    const labels = rowMenuItems({
      ...handlers,
      collection: { name: "Christmas" },
    }).map((item) => item.label);
    for (const label of ["Edit", "Rename", "Print"]) {
      expect(labels).not.toContain(label);
    }
  });
});

// Requirement "A change on a row that doesn't get through".
describe("the note when a row comes back", () => {
  it("says the sheet couldn't be deleted", () => {
    expect(failureNote("Stille Nacht", "delete")).toBe(
      "“Stille Nacht” couldn’t be deleted. Try again.",
    );
  });

  it("says the sheet couldn't be removed from the collection", () => {
    expect(failureNote("Stille Nacht", "remove", { name: "Christmas" })).toBe(
      "“Stille Nacht” couldn’t be removed from Christmas. Try again.",
    );
  });
});
