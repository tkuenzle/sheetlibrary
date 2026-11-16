import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { EdgePanel } from "./edge-panel";

// Opening, Escape, a click beside the panel and closing when the window
// changes are tested in the browser, through the help (e2e/editor.spec.ts)
// and the rail (e2e/library.spec.ts).

function nothing() {
  return undefined;
}

describe("EdgePanel", () => {
  it("is an empty dialog from its side while closed", () => {
    const html = renderToString(
      <EdgePanel
        side="left"
        open={false}
        onClosed={nothing}
        closeWhen="(min-width: 1024px)"
        className="rail-panel"
        aria-label="Main"
      >
        {() => <p>Inside</p>}
      </EdgePanel>,
    );
    expect(html).toMatch(/^<dialog class="edge-panel rail-panel"/);
    expect(html).toContain('data-side="left"');
    expect(html).toContain('aria-label="Main"');
    expect(html).not.toContain("Inside");
  });

  it("renders its content while open", () => {
    const html = renderToString(
      <EdgePanel
        side="right"
        open
        onClosed={nothing}
        closeWhen="(min-width: 1024px)"
        aria-labelledby="title"
      >
        {() => <h2 id="title">How to edit</h2>}
      </EdgePanel>,
    );
    expect(html).toContain('aria-labelledby="title"');
    expect(html).toContain("How to edit");
    expect(html).not.toContain("data-closing");
  });
});
