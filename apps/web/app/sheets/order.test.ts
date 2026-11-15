import { describe, expect, it } from "vitest";

import {
  keepSheetOrder,
  type ListedSheet,
  orderLabel,
  readSheetOrder,
  sortSheets,
} from "./order";

describe("sheet order cookie", () => {
  it("reads the order among other cookies", () => {
    expect(readSheetOrder("a=1; sheet-order=artist")).toBe("artist");
    expect(readSheetOrder("sheet-order=added; a=1")).toBe("added");
  });

  it("gives Title, A to Z without the cookie, or with a wrong value", () => {
    expect(readSheetOrder(null)).toBe("title");
    expect(readSheetOrder("a=1")).toBe("title");
    expect(readSheetOrder("sheet-order=")).toBe("title");
    expect(readSheetOrder("sheet-order=newest")).toBe("title");
  });

  // Scenario "From Sheets to a collection": the cookie is for the whole site.
  it("keeps the order for 400 days, on the whole site", () => {
    const target = { cookie: "", location: { protocol: "https:" } };
    keepSheetOrder("edited", target);
    expect(target.cookie).toBe(
      "sheet-order=edited; Path=/; Max-Age=34560000; SameSite=Lax; Secure",
    );
    expect(readSheetOrder(target.cookie)).toBe("edited");
  });

  it("leaves out Secure over http", () => {
    const target = { cookie: "", location: { protocol: "http:" } };
    keepSheetOrder("artist", target);
    expect(target.cookie).not.toContain("Secure");
  });

  it("names each order as the control says it", () => {
    expect(orderLabel("title")).toBe("Title, A to Z");
    expect(orderLabel("artist")).toBe("Artist, A to Z");
    expect(orderLabel("edited")).toBe("Last edited");
    expect(orderLabel("added")).toBe("Last added");
  });
});

describe("sorting sheets", () => {
  const sheet = (
    title: string,
    artist: string | undefined,
    updatedAt: number,
    addedAt: number,
  ): ListedSheet => ({
    title,
    ...(artist === undefined ? {} : { artist }),
    updatedAt,
    addedAt,
  });
  const sheets = [
    sheet("Stille Nacht", "Franz Xaver Gruber", 4000, 1000),
    sheet("Danny Boy", "Frederic Weatherly", 1000, 4000),
    sheet("Sternsinger", undefined, 3000, 2000),
    sheet("Drüü Könige", "Trad.", 2000, 3000),
    sheet("Amazing Grace", "John Newton", 2000, 3000),
  ];
  const titles = (list: ListedSheet[]) => list.map((s) => s.title);

  // Scenario "A to Z by default".
  it("sorts by title as people read it", () => {
    expect(titles(sortSheets(sheets, "title"))).toEqual([
      "Amazing Grace",
      "Danny Boy",
      "Drüü Könige",
      "Sternsinger",
      "Stille Nacht",
    ]);
  });

  // Scenario "By artist".
  it("sorts by artist, with sheets without one last", () => {
    expect(titles(sortSheets(sheets, "artist"))).toEqual([
      "Stille Nacht",
      "Danny Boy",
      "Amazing Grace",
      "Drüü Könige",
      "Sternsinger",
    ]);
  });

  it("puts the last edited first, ties A to Z", () => {
    expect(titles(sortSheets(sheets, "edited"))).toEqual([
      "Stille Nacht",
      "Sternsinger",
      "Amazing Grace",
      "Drüü Könige",
      "Danny Boy",
    ]);
  });

  it("puts the last added first, ties A to Z", () => {
    expect(titles(sortSheets(sheets, "added"))).toEqual([
      "Danny Boy",
      "Amazing Grace",
      "Drüü Könige",
      "Sternsinger",
      "Stille Nacht",
    ]);
  });

  it("leaves the list it was given as it was", () => {
    const copy = [...sheets];
    sortSheets(sheets, "edited");
    expect(sheets).toEqual(copy);
  });
});
