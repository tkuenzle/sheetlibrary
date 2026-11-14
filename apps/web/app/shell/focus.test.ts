import { describe, expect, it } from "vitest";

import { KEEP_FOCUS, movesFocus } from "./focus";

const move = {
  from: "/sheets",
  to: "/collections",
  state: null,
  focusInPage: false,
};

describe("movesFocus", () => {
  // Scenarios "Opening Collections" and "Opening a sheet".
  it("puts the focus on the heading after a move to another page", () => {
    expect(movesFocus(move)).toBe(true);
    expect(movesFocus({ ...move, to: "/sheets/abc" })).toBe(true);
  });

  it("leaves the focus when only the search changed", () => {
    expect(movesFocus({ ...move, to: "/sheets" })).toBe(false);
  });

  // Scenario "From Collections": a search keeps the focus in its field.
  it("leaves the focus when the navigation keeps it", () => {
    expect(movesFocus({ ...move, state: KEEP_FOCUS })).toBe(false);
    expect(movesFocus({ ...move, state: { keepFocus: false } })).toBe(true);
    expect(movesFocus({ ...move, state: "keepFocus" })).toBe(true);
  });

  // Scenario "A new sheet": the title field has taken the focus.
  it("leaves the focus where the new page has put it", () => {
    expect(movesFocus({ ...move, focusInPage: true })).toBe(false);
  });
});
