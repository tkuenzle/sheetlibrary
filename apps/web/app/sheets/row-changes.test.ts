import { describe, expect, it } from "vitest";

import { keepListOnFailure, rowAnswer } from "./row-changes";

function request(fields: [string, string][]) {
  const body = new FormData();
  for (const [name, value] of fields) body.append(name, value);
  return new Request("https://sheetlibrary.com/sheets", {
    method: "POST",
    body,
  });
}

const offline = new TypeError("Failed to fetch");

describe("a row's change in the browser", () => {
  // Scenario "Deleting offline".
  it("answers that a delete didn't get through, rather than failing", async () => {
    const answer = await keepListOnFailure(
      request([
        ["intent", "delete"],
        ["sheetId", "stille000000"],
      ]),
      () => Promise.reject(offline),
    );
    expect(answer).toEqual({ ok: false, intent: "delete" });
  });

  it("answers the same for a remove that fails on the server", async () => {
    const answer = await keepListOnFailure(
      request([["intent", "remove"]]),
      () => Promise.reject(new Error("Unexpected Server Error")),
    );
    expect(answer).toEqual({ ok: false, intent: "remove" });
  });

  it("lets other changes fail as before, such as New sheet", async () => {
    await expect(
      keepListOnFailure(request([]), () => Promise.reject(offline)),
    ).rejects.toBe(offline);
  });

  it("passes the server's answer on", async () => {
    const answer = { ok: true, intent: "delete" };
    expect(
      await keepListOnFailure(request([["intent", "delete"]]), () =>
        Promise.resolve(answer),
      ),
    ).toBe(answer);
  });
});

describe("the action's answer to a row's change", () => {
  it("is ok, or 404 when the sheet isn't the person's", () => {
    expect(rowAnswer("delete", true)).toEqual({ ok: true, intent: "delete" });
    expect(rowAnswer("remove", false)).toMatchObject({
      data: { ok: false, intent: "remove" },
      init: { status: 404 },
    });
  });
});
