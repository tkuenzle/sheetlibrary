import { describe, expect, it } from "vitest";

import { mediaWidths } from "./breakpoints";

const stylesheets = import.meta.glob<string>("./**/*.css", {
  query: "?raw",
  import: "default",
  eager: true,
});

describe("breakpoints", () => {
  // Vitest empties CSS unless vitest.config.ts lets it through.
  it("reads the stylesheets", () => {
    expect(stylesheets["./ui/tokens.css"]).toContain("--page");
  });

  it("are the only widths in the CSS", () => {
    for (const [file, css] of Object.entries(stylesheets)) {
      for (const [width] of css.matchAll(/\((?:min|max)-width:[^)]*\)/g)) {
        expect(mediaWidths, `${width} in ${file}`).toContain(width);
      }
    }
  });
});
