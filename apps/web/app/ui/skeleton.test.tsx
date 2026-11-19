import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Bar } from "./skeleton";

describe("Bar", () => {
  it("is a quiet bar as wide as asked, hidden from screen readers", () => {
    const html = renderToString(<Bar width={6} />);
    expect(html).toBe(
      '<span class="skeleton-bar" style="width:6em" aria-hidden="true"></span>',
    );
  });

  it("takes the soft accent for chords and keys", () => {
    const html = renderToString(<Bar width={1.6} accent />);
    expect(html).toContain('class="skeleton-bar skeleton-bar-accent"');
    expect(html).toContain('style="width:1.6em"');
  });
});
