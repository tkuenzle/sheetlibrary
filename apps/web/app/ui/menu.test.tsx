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
});
