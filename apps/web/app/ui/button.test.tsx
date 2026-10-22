import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Button, IconButton } from "./button";
import { Note } from "./note";
import { Toolbar } from "./toolbar";

describe("Button", () => {
  it("is a plain button, not a submit button, unless asked", () => {
    expect(renderToString(<Button>OK</Button>)).toMatch(
      /^<button type="button" class="button button-filled">OK<\/button>$/,
    );
    expect(renderToString(<Button type="submit">OK</Button>)).toContain(
      'type="submit"',
    );
  });
});

describe("IconButton", () => {
  it("is named by its label", () => {
    const html = renderToString(<IconButton icon="add" label="Add chord" />);
    expect(html).toContain('aria-label="Add chord"');
  });

  it("shows its label in a tooltip that screen readers skip", () => {
    const html = renderToString(<IconButton icon="add" label="Add chord" />);
    expect(html).toMatch(
      /<span class="tooltip tooltip-bottom" aria-hidden="true" hidden="">Add chord<\/span>/,
    );
  });

  it("needs a label", () => {
    // @ts-expect-error: the label is required.
    renderToString(<IconButton icon="add" />);
  });
});

describe("Toolbar", () => {
  it("has the toolbar role and a name", () => {
    const html = renderToString(
      <Toolbar label="Section" orientation="vertical" />,
    );
    expect(html).toContain('role="toolbar"');
    expect(html).toContain('aria-label="Section"');
    expect(html).toContain('aria-orientation="vertical"');
  });
});

describe("Note", () => {
  it("shows its text next to an info icon", () => {
    const html = renderToString(<Note>Nothing is saved.</Note>);
    expect(html).toMatch(/<svg class="icon".*<p>Nothing is saved.<\/p>/);
  });
});
