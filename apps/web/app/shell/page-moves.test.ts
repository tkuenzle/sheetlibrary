import { describe, expect, it } from "vitest";

import {
  isLate,
  moveKind,
  openedFrom,
  type PageKind,
  pageKind,
  rowDetails,
  sheetTitleName,
  titleMoveStart,
} from "./page-moves";

const shell: PageKind = { kind: "shell" };
const play: PageKind = { kind: "play", sheet: "a" };
const edit: PageKind = { kind: "edit", sheet: "a" };

describe("pageKind", () => {
  it("knows the shell's screens, a sheet's play view and edit mode", () => {
    expect(
      pageKind([
        { id: "root", params: {} },
        { id: "routes/shell", params: {} },
        { id: "routes/collection", params: { id: "c" } },
      ]),
    ).toEqual(shell);
    expect(
      pageKind([
        { id: "root", params: { id: "a" } },
        { id: "routes/sheet", params: { id: "a" } },
      ]),
    ).toEqual(play);
    expect(
      pageKind([
        { id: "root", params: { id: "a" } },
        { id: "routes/sheet.edit", params: { id: "a" } },
      ]),
    ).toEqual(edit);
  });

  it("knows no other page", () => {
    expect(
      pageKind([
        { id: "root", params: {} },
        { id: "routes/home", params: {} },
      ]),
    ).toBeNull();
  });
});

describe("moveKind", () => {
  // Scenario "From Sheets to Collections".
  it("fades between the shell's screens", () => {
    expect(moveKind(shell, shell)).toBe("fade");
  });

  // Scenario "Opening a sheet". A new sheet opens in edit mode.
  it("raises a sheet over the shell", () => {
    expect(moveKind(shell, play)).toBe("rise");
    expect(moveKind(shell, edit)).toBe("rise");
  });

  // Scenario "The browser's back", and a link from a sheet to a collection.
  it("drops a sheet into the shell", () => {
    expect(moveKind(play, shell)).toBe("drop");
    expect(moveKind(edit, shell)).toBe("drop");
  });

  // Scenarios "From playing to editing" and "Done".
  it("changes only the mode between play and edit of one sheet", () => {
    expect(moveKind(play, edit)).toBe("mode");
    expect(moveKind(edit, play)).toBe("mode");
  });

  // Scenarios "Swiping back" and "A slow answer".
  it("doesn't move when the browser showed its own move, or the data came late", () => {
    expect(moveKind(play, shell, true)).toBe("none");
  });

  it("doesn't move between two sheets, or to and from other pages", () => {
    expect(moveKind(play, { kind: "edit", sheet: "b" })).toBe("none");
    expect(moveKind(play, { kind: "play", sheet: "b" })).toBe("none");
    expect(moveKind(null, play)).toBe("none");
    expect(moveKind(shell, null)).toBe("none");
  });
});

describe("isLate", () => {
  // Scenario "A slow answer": late once the loading bar would show.
  it("is late after the loading bar's wait", () => {
    expect(isLate(150)).toBe(false);
    expect(isLate(200)).toBe(false);
    expect(isLate(201)).toBe(true);
  });
});

// Requirement "What the skeleton already knows": a row's link carries its
// title and artist for the sheet's heading.
describe("openedFrom and rowDetails", () => {
  it("carries the row's list, title and artist", () => {
    const state = openedFrom("list", {
      title: "Stille Nacht",
      artist: "Franz Xaver Gruber",
    });
    expect(state).toEqual({
      openedFrom: "list",
      title: "Stille Nacht",
      artist: "Franz Xaver Gruber",
    });
    expect(rowDetails(state)).toEqual({
      title: "Stille Nacht",
      artist: "Franz Xaver Gruber",
    });
  });

  it("leaves out an artist the row doesn't have", () => {
    const state = openedFrom("recent", { title: "Sternsinger" });
    expect(state).toEqual({ openedFrom: "recent", title: "Sternsinger" });
    expect(rowDetails(state)).toEqual({ title: "Sternsinger" });
  });

  it("gives nothing for a sheet opened another way", () => {
    expect(rowDetails(null)).toBeNull();
    expect(rowDetails({ openedFrom: "list" })).toBeNull();
    expect(rowDetails("Stille Nacht")).toBeNull();
  });
});

describe("sheetTitleName", () => {
  const list = { pathname: "/sheets", state: null };
  const opened = (from: string) => ({
    pathname: "/sheets/a",
    state: { openedFrom: from },
  });

  // Scenario "Opening a sheet", from Recent on Sheets, which may show the
  // same sheet in the list too.
  it("names only the row in the list it was opened from, and the heading", () => {
    const move = { currentLocation: list, nextLocation: opened("recent") };
    expect(sheetTitleName("a", "recent", move)).toBe("sheet-title");
    expect(sheetTitleName("a", "list", move)).toBeUndefined();
    expect(sheetTitleName("a", null, move)).toBe("sheet-title");
    expect(sheetTitleName("b", "recent", move)).toBeUndefined();
  });

  // Scenario "The browser's back": the sheet is where the move starts.
  it("names the same row coming back", () => {
    const move = { currentLocation: opened("list"), nextLocation: list };
    expect(sheetTitleName("a", "list", move)).toBe("sheet-title");
    expect(sheetTitleName("a", "recent", move)).toBeUndefined();
  });

  it("names nothing between play and edit, or without a move", () => {
    const move = {
      currentLocation: opened("list"),
      nextLocation: { pathname: "/sheets/a/edit", state: null },
    };
    expect(sheetTitleName("a", null, move)).toBeUndefined();
    expect(sheetTitleName("a", null, null)).toBeUndefined();
  });
});

describe("titleMoveStart", () => {
  // The row's title, 17px, and the heading, twice as large, further up.
  const row = { x: 32, y: 169, width: 150, height: 22 };
  const heading = { x: 16, y: 64, width: 300, height: 44 };

  it("starts the heading's box scaled and shifted onto the row's", () => {
    const { dx, dy, sx, sy } = titleMoveStart(row, heading);
    expect([sx, sy]).toEqual([0.5, 0.5]);
    // A point at x lands at dx + sx * x: the heading's corner on the row's.
    expect(dx + sx * heading.x).toBe(row.x);
    expect(dy + sy * heading.y).toBe(row.y);
    expect(sx * heading.width).toBe(row.width);
  });

  it("starts in place when the boxes are the same", () => {
    expect(titleMoveStart(row, row)).toEqual({ dx: 0, dy: 0, sx: 1, sy: 1 });
  });
});
