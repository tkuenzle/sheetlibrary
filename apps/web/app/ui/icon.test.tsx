import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Icon } from "./icon";
import { iconPaths } from "./icons";

describe("Icon", () => {
  it("renders the icon as an SVG hidden from screen readers", () => {
    const html = renderToString(<Icon name="add" />);
    expect(html).toMatch(/^<svg [^>]*aria-hidden="true"/);
    expect(html).toContain(`<path d="${iconPaths.add}">`);
  });

  it("has a path for every listed icon", () => {
    for (const path of Object.values(iconPaths)) {
      expect(path).toMatch(/^M/);
    }
  });
});
