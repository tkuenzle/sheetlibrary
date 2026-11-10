import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PlayEditSwitch } from "./play-edit-switch";

describe("PlayEditSwitch", () => {
  it("links to the sheet's two pages and marks the current one", () => {
    const html = renderToString(
      <PlayEditSwitch id="abcdefghijkl" current="play" />,
    );
    expect(html).toContain('<nav class="play-edit-switch"');
    expect(html).toMatch(
      /href="\/sheets\/abcdefghijkl" aria-label="Play" aria-current="page"/,
    );
    expect(html).toMatch(
      /href="\/sheets\/abcdefghijkl\/edit" aria-label="Edit">/,
    );
  });

  it("marks Edit in the editor", () => {
    const html = renderToString(
      <PlayEditSwitch id="abcdefghijkl" current="edit" />,
    );
    expect(html).toMatch(/aria-label="Play">/);
    expect(html).toMatch(/aria-label="Edit" aria-current="page"/);
  });

  // Scenario "From playing to editing".
  it("carries the key and the capo to both pages", () => {
    const html = renderToString(
      <PlayEditSwitch id="abcdefghijkl" current="play" query="key=A&capo=2" />,
    );
    expect(html).toContain('href="/sheets/abcdefghijkl?key=A&amp;capo=2"');
    expect(html).toContain('href="/sheets/abcdefghijkl/edit?key=A&amp;capo=2"');
  });
});
