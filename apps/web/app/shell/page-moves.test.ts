import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  durationMs,
  headingTitleName,
  isLate,
  type MoveArgs,
  moveKind,
  noteStepInHistory,
  openedFrom,
  type PageKind,
  pageKind,
  pageMovesMiddleware,
  patternKind,
  pickMove,
  rowDetails,
  showPage,
  titleMoveFromKeyframes,
  titleMoveStart,
  titleName,
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

describe("patternKind", () => {
  // Each route of the app (routes.ts), with the ids `pageKind` reads.
  const routes: { pattern: string; ids: string[] }[] = [
    { pattern: "/sheets", ids: ["root", "routes/shell", "routes/sheets"] },
    {
      pattern: "/collections",
      ids: ["root", "routes/shell", "routes/collections"],
    },
    {
      pattern: "/collections/:id",
      ids: ["root", "routes/shell", "routes/collection"],
    },
    { pattern: "/account", ids: ["root", "routes/shell", "routes/account"] },
    { pattern: "/sheets/:id", ids: ["root", "routes/sheet"] },
    { pattern: "/sheets/:id/edit", ids: ["root", "routes/sheet.edit"] },
    { pattern: "/editor", ids: ["root", "routes/editor"] },
    { pattern: "/", ids: ["root", "routes/home"] },
  ];

  it("agrees with pageKind on every page", () => {
    for (const { pattern, ids } of routes) {
      const params = pattern.includes(":id") ? { id: "a" } : {};
      const kind = pageKind(ids.map((id) => ({ id, params })));
      expect(patternKind(pattern, params)).toEqual(kind);
      // As React Router joins the paths, without the leading slash.
      expect(patternKind(pattern.slice(1), params)).toEqual(kind);
    }
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

describe("pickMove", () => {
  const sheets = { path: "/sheets", kind: shell };
  const sheet = { path: "/sheets/a", kind: play };
  const quick = { browserMoved: false, late: false };

  it("moves by the kind of the two pages", () => {
    expect(pickMove(sheets, sheet, quick)).toBe("rise");
    expect(pickMove(sheet, sheets, quick)).toBe("drop");
  });

  // Scenario "A search": only the address changes.
  it("doesn't move when the page stays", () => {
    expect(pickMove(sheets, sheets, quick)).toBe("none");
    expect(pickMove(null, sheet, quick)).toBe("none");
  });

  it("doesn't move after the browser's own move, or when the data came late", () => {
    expect(pickMove(sheet, sheets, { browserMoved: true, late: false })).toBe(
      "none",
    );
    expect(pickMove(sheets, sheet, { browserMoved: false, late: true })).toBe(
      "none",
    );
  });
});

describe("pageMovesMiddleware", () => {
  const toSheets = (navigationType: string | null): MoveArgs => ({
    url: new URL("https://example.com/sheets"),
    pattern: "/sheets",
    params: {},
    unstable_initiator: "navigation",
    unstable_navigationType: navigationType,
  });

  beforeEach(() => {
    vi.useFakeTimers();
    showPage({ path: "/sheets/a", kind: play });
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
  });

  // React renders an update made during `popstate` at once, without a move.
  it("waits one task before the loaders of a step back", async () => {
    const next = vi.fn(() => Promise.resolve("loaded"));
    const done = pageMovesMiddleware(toSheets("POP"), next);
    await Promise.resolve();
    expect(next).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(0);
    expect(next).toHaveBeenCalledOnce();
    await expect(done).resolves.toBe("loaded");
  });

  it("doesn't wait on a push, or after the browser's own move", async () => {
    const push = vi.fn(() => Promise.resolve("loaded"));
    void pageMovesMiddleware(toSheets("PUSH"), push);
    await Promise.resolve();
    expect(push).toHaveBeenCalledOnce();

    noteStepInHistory({ hasUAVisualTransition: true });
    const back = vi.fn(() => Promise.resolve("loaded"));
    void pageMovesMiddleware(toSheets("POP"), back);
    await Promise.resolve();
    expect(back).toHaveBeenCalledOnce();
  });

  it("leaves fetchers alone", async () => {
    const next = vi.fn(() => Promise.resolve("loaded"));
    void pageMovesMiddleware(
      { ...toSheets(null), unstable_initiator: "fetcher" },
      next,
    );
    await Promise.resolve();
    expect(next).toHaveBeenCalledOnce();
  });
});

describe("titleName and headingTitleName", () => {
  // Recent and the list can show the same sheet, and two boundaries with
  // one name make React fail.
  it("names a row's title by its list", () => {
    expect(titleName("list", "a")).toBe("title-list-a");
    expect(titleName("recent", "a")).not.toBe(titleName("list", "a"));
  });

  it("names the heading as the row it was opened from", () => {
    expect(headingTitleName("a", openedFrom("recent", { title: "T" }))).toBe(
      "title-recent-a",
    );
    expect(headingTitleName("a", null)).toBeUndefined();
    expect(headingTitleName("a", { openedFrom: "elsewhere" })).toBeUndefined();
  });
});

describe("titleMoveFromKeyframes", () => {
  it("starts from the old box, read from the browser's keyframes", () => {
    expect(
      titleMoveFromKeyframes(
        {
          transform: "matrix(1, 0, 0, 1, 20, 300)",
          width: "100px",
          height: "20px",
        },
        {
          transform: "matrix(1, 0, 0, 1, 10, 80)",
          width: "200px",
          height: "40px",
        },
      ),
    ).toEqual(
      titleMoveStart(
        { x: 20, y: 300, width: 100, height: 20 },
        { x: 10, y: 80, width: 200, height: 40 },
      ),
    );
  });

  it("keeps the size when only the first keyframe has it", () => {
    expect(
      titleMoveFromKeyframes(
        {
          transform: "matrix(1, 0, 0, 1, 0, 50)",
          width: "100px",
          height: "20px",
        },
        { transform: "none" },
      ),
    ).toEqual({ dx: 0, dy: 50, sx: 1, sy: 1 });
  });

  it("gives nothing for keyframes it can't read", () => {
    expect(titleMoveFromKeyframes({}, {})).toBeNull();
  });
});

describe("durationMs", () => {
  it("reads a motion token", () => {
    expect(durationMs("300ms")).toBe(300);
    expect(durationMs(" 0s")).toBe(0);
    expect(durationMs("0.15s")).toBe(150);
    expect(durationMs("")).toBe(0);
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
