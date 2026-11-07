import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Menu } from "./menu";

describe("Menu", () => {
  it("is a closed menu button named by its label", () => {
    const html = renderToString(
      <Menu
        label="More for this sheet"
        items={[
          {
            label: "Rename",
            icon: "edit",
            onSelect: () => undefined,
          },
        ]}
      />,
    );
    expect(html).toContain('aria-label="More for this sheet"');
    expect(html).toContain('aria-haspopup="menu"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('role="menu"');
    expect(html).not.toContain("Rename");
  });

  it("opens under the button at its right edge by default", () => {
    const html = renderToString(<Menu label="More" items={[]} />);
    expect(html).toMatch(/^<div class="menu menu-below-end"/);
  });

  it("shows its label and a chevron in a tonal button with text", () => {
    const html = renderToString(
      <Menu
        label="Import"
        icon="contentPasteGo"
        text
        size="large"
        placement="above-end"
        items={[]}
      />,
    );
    expect(html).toMatch(/^<div class="menu menu-above-end"/);
    expect(html).toMatch(
      /<button type="button" class="button button-tonal button-large menu-toggle-text" aria-haspopup="menu" aria-expanded="false"/,
    );
    expect(html).toMatch(/<\/svg>Import<svg /);
    expect(html).not.toContain("aria-label");
    expect(html).not.toContain("tooltip");
  });
});
