import type { ShouldRevalidateFunctionArgs } from "react-router";
import { describe, expect, it } from "vitest";

import {
  changedNothing,
  revalidateAfterChanges,
  revalidateUnlessUnchanged,
} from "./revalidate";

const args = (
  from: string,
  to: string,
  formMethod?: "POST",
  actionResult?: unknown,
) =>
  ({
    currentUrl: new URL(from, "https://sheetlibrary.com"),
    nextUrl: new URL(to, "https://sheetlibrary.com"),
    formMethod,
    actionResult,
    defaultShouldRevalidate: true,
  }) as ShouldRevalidateFunctionArgs;

describe("revalidateAfterChanges", () => {
  it("keeps the data on a move to another screen", () => {
    expect(revalidateAfterChanges(args("/sheets", "/collections"))).toBe(false);
    expect(
      revalidateAfterChanges(args("/collections/a", "/collections/b")),
    ).toBe(false);
  });

  it("keeps the data on a search", () => {
    expect(revalidateAfterChanges(args("/sheets", "/sheets?q=gr"))).toBe(false);
  });

  it("loads again after a form or a fetcher", () => {
    expect(
      revalidateAfterChanges(args("/collections/a", "/collections/a", "POST")),
    ).toBe(true);
    expect(
      revalidateAfterChanges(args("/sheets", "/sheets/x/edit", "POST")),
    ).toBe(true);
  });

  it("loads again on the same address, as after revalidate() or Try again", () => {
    expect(
      revalidateAfterChanges(args("/collections/a", "/collections/a")),
    ).toBe(true);
  });
});

// Scenario "Deleting offline": the list and the frame stay.
describe("a change that didn't get through", () => {
  const failed = { ok: false, intent: "delete" };

  it("is told apart from one that did", () => {
    expect(changedNothing(failed)).toBe(true);
    expect(changedNothing({ ok: true })).toBe(false);
    expect(changedNothing(undefined)).toBe(false);
    expect(changedNothing(null)).toBe(false);
  });

  it("loads nothing again around the page", () => {
    expect(
      revalidateAfterChanges(args("/sheets", "/sheets", "POST", failed)),
    ).toBe(false);
  });

  it("loads the page again only after a change that got through", () => {
    expect(
      revalidateUnlessUnchanged(args("/sheets", "/sheets", "POST", failed)),
    ).toBe(false);
    expect(
      revalidateUnlessUnchanged(
        args("/sheets", "/sheets", "POST", { ok: true }),
      ),
    ).toBe(true);
  });
});
