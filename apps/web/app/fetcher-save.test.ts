import { describe, expect, it } from "vitest";

import { saveOutcome } from "./fetcher-save";
import { NameRefused } from "./ui/name-dialog";

describe("saveOutcome", () => {
  it("goes through on ok", () => {
    expect(saveOutcome({ ok: true })).toBeUndefined();
  });

  it("refuses with the note for a name already used", () => {
    const error = saveOutcome({
      ok: false,
      refused: "That name is already used.",
    });
    expect(error).toBeInstanceOf(NameRefused);
    expect(error?.message).toBe("That name is already used.");
  });

  it("fails, without a note of its own, when the change didn't get through", () => {
    const error = saveOutcome({ ok: false });
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(NameRefused);
  });

  it("goes through when a redirect left no answer", () => {
    expect(saveOutcome(undefined)).toBeUndefined();
  });
});
