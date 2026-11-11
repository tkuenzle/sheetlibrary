import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Menu, MenuEntry, type MenuItem } from "./menu";

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

  describe("an item", () => {
    const item: MenuItem = {
      label: "Print",
      icon: "print",
      onSelect: () => undefined,
    };

    it("is a plain menu item without a check", () => {
      const html = renderToString(
        <MenuEntry item={item} onSelect={item.onSelect} />,
      );
      expect(html).toContain('role="menuitem"');
      expect(html).not.toContain("aria-checked");
      expect(html.match(/<svg /g)).toHaveLength(1);
    });

    it("is a checkbox item, checked with a check after its name", () => {
      const html = renderToString(
        <MenuEntry
          item={{
            ...item,
            icon: "lyrics",
            label: "Lyrics only",
            checked: true,
          }}
          onSelect={item.onSelect}
        />,
      );
      expect(html).toContain('role="menuitemcheckbox" aria-checked="true"');
      expect(html).toMatch(/Lyrics only<svg /);
    });

    it("is a checkbox item, unchecked without a check", () => {
      const html = renderToString(
        <MenuEntry
          item={{
            ...item,
            icon: "lyrics",
            label: "Lyrics only",
            checked: false,
          }}
          onSelect={item.onSelect}
        />,
      );
      expect(html).toContain('role="menuitemcheckbox" aria-checked="false"');
      expect(html.match(/<svg /g)).toHaveLength(1);
    });

    it("can have a line after it", () => {
      const html = renderToString(
        <MenuEntry
          item={{ ...item, separated: true }}
          onSelect={item.onSelect}
        />,
      );
      expect(html).toMatch(
        /<\/button><div role="separator" class="menu-separator"><\/div>$/,
      );
    });
  });
});
