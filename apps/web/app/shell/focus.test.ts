import { describe, expect, it } from "vitest";

import { movesFocus } from "./focus";

const move = { from: "/sheets", to: "/collections", focusInPage: false };

describe("movesFocus", () => {
  // Scenarios "Opening Collections" and "Opening a sheet".
  it("puts the focus on the heading after a move to another page", () => {
    expect(movesFocus(move)).toBe(true);
    expect(movesFocus({ ...move, to: "/sheets/abc" })).toBe(true);
  });

  // A search only changes the search of the address, so typing keeps the
  // focus in the field.
  it("leaves the focus when only the search changed", () => {
    expect(movesFocus({ ...move, to: "/sheets" })).toBe(false);
  });

  // Scenario "A new sheet": the title field has taken the focus.
  it("leaves the focus where the new page has put it", () => {
    expect(movesFocus({ ...move, focusInPage: true })).toBe(false);
  });
});
