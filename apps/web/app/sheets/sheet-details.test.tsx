import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ArtistInPlace, TitleInPlace } from "./sheet-details";

function nothing() {
  return undefined;
}

function title(editing: boolean, readOnly = false) {
  return renderToString(
    <TitleInPlace
      title="Amazing Grace"
      editing={editing}
      readOnly={readOnly}
      onOpen={nothing}
      onClose={nothing}
    />,
  );
}

function artist(value: string | undefined, editing = false, readOnly = false) {
  return renderToString(
    <ArtistInPlace
      artist={value}
      editing={editing}
      readOnly={readOnly}
      onOpen={nothing}
      onClose={nothing}
    />,
  );
}

describe("TitleInPlace", () => {
  it("is a button with the title", () => {
    expect(title(false)).toMatch(/^<button [^>]*>Amazing Grace<\/button>$/);
  });

  it("opens as a field named Title that takes at most 100 characters", () => {
    const html = title(true);
    expect(html).toMatch(/^<input /);
    expect(html).toContain('aria-label="Title"');
    expect(html).toContain('maxLength="100"');
    expect(html).toContain('value="Amazing Grace"');
  });

  // Scenario "Renaming after a conflict".
  it("can't be opened when the sheet is read-only", () => {
    expect(title(false, true)).toContain("disabled");
  });
});

describe("ArtistInPlace", () => {
  it("is a button with the artist", () => {
    expect(artist("Chris Tomlin")).toMatch(
      /^<button [^>]*>Chris Tomlin<\/button>$/,
    );
  });

  it("offers Add artist when there is none", () => {
    expect(artist(undefined)).toContain("Add artist");
  });

  it("opens as a field named Artist, empty for a new artist", () => {
    const html = artist(undefined, true);
    expect(html).toContain('aria-label="Artist"');
    expect(html).toContain('maxLength="100"');
    expect(html).toContain('value=""');
  });

  it("shows no Add artist and can't be opened when read-only", () => {
    expect(artist(undefined, false, true)).toBe("");
    expect(artist("Chris Tomlin", false, true)).toContain("disabled");
  });
});
