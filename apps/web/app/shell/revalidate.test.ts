import type { ShouldRevalidateFunctionArgs } from "react-router";
import { describe, expect, it } from "vitest";

import { revalidateAfterChanges } from "./revalidate";

const args = (from: string, to: string, formMethod?: "POST") =>
  ({
    currentUrl: new URL(from, "https://sheetlibrary.com"),
    nextUrl: new URL(to, "https://sheetlibrary.com"),
    formMethod,
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
