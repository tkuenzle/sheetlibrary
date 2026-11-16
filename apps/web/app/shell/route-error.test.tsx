import type { ComponentType } from "react";
import { renderToString } from "react-dom/server";
import { createRoutesStub } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { ErrorBoundary as AccountError } from "../routes/account";
import { ErrorBoundary as CollectionError } from "../routes/collection";
import { ErrorBoundary as CollectionsError } from "../routes/collections";
import { ErrorBoundary as SheetError } from "../routes/sheet";
import { ErrorBoundary as SheetEditError } from "../routes/sheet.edit";
import { ErrorBoundary as SheetsError } from "../routes/sheets";
import Shell, { ErrorBoundary as ShellError } from "../routes/shell";
import { loadAgain } from "./route-error";
import { SignedInContext } from "./signed-in";

const offline = new TypeError("Failed to fetch");
const collections = [
  { id: "christmas000", name: "Christmas", count: 14, titles: [] },
];

describe("loadAgain", () => {
  it("loads the same address again, in place of this entry", () => {
    const navigate = vi.fn();
    loadAgain(navigate, {
      pathname: "/collections/christmas000",
      search: "?a=1",
      hash: "",
    });
    expect(navigate).toHaveBeenCalledWith(
      { pathname: "/collections/christmas000", search: "?a=1", hash: "" },
      { replace: true },
    );
  });
});

// A screen in the shell whose page failed: the screen's boundary renders
// inside the shell, which keeps its navigation.
function renderInShell(path: string, ErrorBoundary: ComponentType) {
  const Stub = createRoutesStub([
    {
      id: "routes/shell",
      Component: Shell as never,
      loader: () => ({ collections }),
      children: [
        { id: "routes/screen", path, Component: () => null, ErrorBoundary },
      ],
    },
  ]);
  return renderToString(
    <SignedInContext value={{ initial: "A" }}>
      <Stub
        initialEntries={[path]}
        hydrationData={{
          loaderData: { "routes/shell": { collections } },
          errors: { "routes/screen": offline },
        }}
      />
    </SignedInContext>,
  );
}

describe("a screen's error boundary", () => {
  // Scenario "Offline in the shell".
  it.each([
    ["/sheets", SheetsError],
    ["/collections", CollectionsError],
    ["/collections/christmas000", CollectionError],
    ["/account", AccountError],
  ])("keeps the shell around the note on %s", (path, ErrorBoundary) => {
    const html = renderInShell(path, ErrorBoundary as ComponentType);
    expect(html).toMatch(/<nav class="nav-rail" aria-label="Main">/);
    expect(html).toMatch(
      /<main [^>]*><div class="page-error">.*<h1 class="page-error-title">Can’t reach Sheet Library<\/h1>/s,
    );
    expect(html).toContain("Try again</button>");
  });

  it("marks the collection that failed in the rail", () => {
    const html = renderInShell(
      "/collections/christmas000",
      CollectionError as ComponentType,
    );
    expect(html).toMatch(
      /<a [^>]*aria-current="page"[^>]*href="\/collections\/christmas000"|<a [^>]*href="\/collections\/christmas000"[^>]*aria-current="page"/,
    );
  });
});

describe("the shell's error boundary", () => {
  it("keeps Sheets, Collections and the account when the shell failed", () => {
    const Stub = createRoutesStub([
      {
        id: "routes/shell",
        Component: Shell as never,
        ErrorBoundary: ShellError as ComponentType,
        children: [{ path: "/sheets", Component: () => null }],
      },
    ]);
    const html = renderToString(
      <SignedInContext value={{ initial: "A" }}>
        <Stub
          initialEntries={["/sheets"]}
          hydrationData={{ errors: { "routes/shell": offline } }}
        />
      </SignedInContext>,
    );
    expect(html).toMatch(/<a [^>]*href="\/sheets"[^>]*>.*Sheets/s);
    expect(html).toMatch(/<a [^>]*href="\/collections"/);
    expect(html).toContain('<span class="nav-avatar" aria-hidden="true">A<');
    expect(html).toContain(
      '<h1 class="page-error-title">Can’t reach Sheet Library</h1>',
    );
  });
});

describe("a sheet's error boundary", () => {
  it.each([
    ["/sheets/abc", SheetError],
    ["/sheets/abc/edit", SheetEditError],
  ])("keeps the top bar above the note on %s", (path, ErrorBoundary) => {
    const Stub = createRoutesStub([
      {
        id: "routes/sheet",
        path,
        Component: () => null,
        ErrorBoundary: ErrorBoundary as ComponentType,
      },
    ]);
    const html = renderToString(
      <SignedInContext value={{ initial: "A" }}>
        <Stub
          initialEntries={[path]}
          hydrationData={{
            errors: { "routes/sheet": new Error("Unexpected Server Error") },
          }}
        />
      </SignedInContext>,
    );
    expect(html).toMatch(/^<header /);
    expect(html).toMatch(/<a [^>]*href="\/sheets" aria-label="Back"/);
    expect(html).toContain(
      '<h1 class="page-error-title">Something went wrong</h1>',
    );
    expect(html).toContain("Try again</button>");
  });
});
