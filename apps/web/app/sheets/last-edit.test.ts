import { describe, expect, it } from "vitest";

import { editDate, lastEdit } from "./last-edit";

// 2 November 2026, 10:00 in Zurich (09:00 UTC).
const now = Date.UTC(2026, 10, 2, 9);
const zurich = "Europe/Zurich";

describe("last edit", () => {
  it("says Today for an edit earlier today", () => {
    expect(lastEdit(Date.UTC(2026, 10, 1, 23, 30), now, zurich)).toBe("Today");
  });

  it("says Yesterday for an edit the day before", () => {
    expect(lastEdit(Date.UTC(2026, 10, 1, 9), now, zurich)).toBe("Yesterday");
  });

  it("goes by the viewer's time zone", () => {
    // 1 November, 23:30 UTC is still 1 November in New York.
    const at = Date.UTC(2026, 10, 1, 23, 30);
    expect(lastEdit(at, now, "America/New_York")).toBe("Yesterday");
  });

  // Scenario "Edited earlier this year".
  it("shows the day and month for an earlier day this year", () => {
    expect(lastEdit(Date.UTC(2026, 9, 28, 12), now, zurich)).toBe("28 Oct");
  });

  it("adds the year before this year", () => {
    expect(lastEdit(Date.UTC(2025, 8, 3, 12), now, zurich)).toBe("3 Sep 2025");
  });

  it("calls an edit from a clock that runs ahead Today", () => {
    expect(lastEdit(now + 60_000, now, zurich)).toBe("Today");
  });

  it("shows only the date before the viewer's time zone is known", () => {
    expect(editDate(Date.UTC(2026, 10, 2, 8), now, "UTC")).toBe("2 Nov");
    expect(editDate(Date.UTC(2025, 8, 3, 12), now, "UTC")).toBe("3 Sep 2025");
  });
});
