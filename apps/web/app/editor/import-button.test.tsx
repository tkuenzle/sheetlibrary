import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ImportButton, ImportForm } from "./import-button";

function nothing() {
  return undefined;
}

describe("ImportButton", () => {
  it("shows the button, with the dialog closed", () => {
    const html = renderToString(<ImportButton onImport={nothing} />);
    expect(html).toContain('aria-label="Import from Ultimate Guitar"');
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain("data-keeps-editing");
    expect(html).not.toContain("<textarea");
  });
});

describe("ImportForm", () => {
  const html = renderToString(
    <ImportForm titleId="title" onCancel={nothing} onImport={nothing} />,
  );

  it("names the dialog", () => {
    expect(html).toContain('<h2 id="title">Import from Ultimate Guitar</h2>');
  });

  it("has a labeled field that keeps the columns", () => {
    expect(html).toMatch(/<label for="([^"]+)">Chords and lyrics<\/label>/);
    expect(html).toMatch(/<textarea [^>]*wrap="off"/);
  });

  it("says the sheet is replaced", () => {
    expect(html).toContain(
      "Importing replaces the sheet on this page. It can’t be undone.",
    );
  });

  it("disables Import while the field is empty", () => {
    expect(html).toMatch(/<button type="submit"[^>]*disabled=""[^>]*>Import/);
    expect(html).toContain("Cancel");
  });
});
