import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ImportButton, ImportForm } from "./import-button";

function nothing() {
  return undefined;
}

const replaces =
  "Importing replaces the sheet on this page. It can’t be undone.";

describe("ImportButton", () => {
  it("shows the button, with the dialog closed", () => {
    const html = renderToString(<ImportButton onImport={nothing} />);
    expect(html).toContain('aria-label="Import from Ultimate Guitar"');
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain("data-keeps-editing");
    expect(html).toContain("button-text");
    expect(html).not.toContain("<textarea");
  });

  it("takes the toggle's look", () => {
    const html = renderToString(
      <ImportButton
        onImport={nothing}
        variant="tonal"
        size="large"
        className="docked"
      />,
    );
    expect(html).toMatch(/^<div class="import-button docked"/);
    expect(html).toMatch(/class="button button-tonal button-large /);
  });
});

describe("ImportForm", () => {
  const render = (
    props: { note?: string; failure?: string; busy?: boolean } = {},
  ) =>
    renderToString(
      <ImportForm
        {...props}
        titleId="title"
        onCancel={nothing}
        onImport={nothing}
      />,
    );
  const html = render({ note: replaces });

  it("names the dialog", () => {
    expect(html).toContain('<h2 id="title">Import from Ultimate Guitar</h2>');
  });

  it("has a labeled field that keeps the columns", () => {
    expect(html).toMatch(/<label for="([^"]+)">Chords and lyrics<\/label>/);
    expect(html).toMatch(/<textarea [^>]*wrap="off"/);
  });

  it("shows the note it is given", () => {
    expect(html).toContain(replaces);
  });

  it("has no note without one", () => {
    expect(render()).not.toContain('class="note"');
  });

  it("disables Import while the field is empty", () => {
    expect(html).toMatch(/<button type="submit"[^>]*disabled=""[^>]*>Import/);
    expect(html).toContain("Cancel");
  });

  it("says why an import failed", () => {
    expect(render({ failure: "The text is too long to import." })).toMatch(
      /class="note".*The text is too long to import\./s,
    );
  });

  it("disables both buttons and keeps the text while importing", () => {
    const busy = render({ busy: true });
    expect(busy.match(/<button [^>]*disabled=""/g)).toHaveLength(2);
    expect(busy).toMatch(/<textarea [^>]*readOnly=""/);
  });
});
