import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { TopBar } from "./top-bar";

describe("TopBar", () => {
  it("links the site's name to the home page", () => {
    expect(renderToString(<TopBar />)).toContain(
      '<a class="top-bar-name" href="/">Sheet Library</a>',
    );
  });

  it("shows the title after the name", () => {
    const html = renderToString(<TopBar title="Amazing Grace" />);
    expect(html).toMatch(/Sheet Library<\/a>.*Amazing Grace/);
  });

  it("shows the actions only when given", () => {
    expect(renderToString(<TopBar />)).not.toContain("top-bar-actions");
    expect(
      renderToString(
        <TopBar>
          <button type="button">Help</button>
        </TopBar>,
      ),
    ).toContain('<div class="top-bar-actions"><button');
  });
});
