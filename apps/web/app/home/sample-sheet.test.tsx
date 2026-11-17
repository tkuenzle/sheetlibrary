import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { seedSong } from "../editor/seed-song";
import { SampleSheet, sampleSheet } from "./sample-sheet";

describe("SampleSheet", () => {
  it("is the seed song's first section", () => {
    expect(sampleSheet.sections).toEqual([seedSong.sections[0]]);
    expect(sampleSheet.sections[0]?.label).toBe("Verse 1");
  });

  // Scenario "Sample section".
  it("shows the title, the artist, the key and capo buttons and the verse", () => {
    const html = renderToString(<SampleSheet />);
    expect(html).toContain("<h2>Amazing Grace</h2>");
    expect(html).toContain("John Newton");
    expect(html).toMatch(/aria-label="Key G"/);
    expect(html).toMatch(/aria-label="Capo"/);
    expect(html).toContain('<div class="sheet-view"');
    expect(html).toContain('<div class="sheet-view-label">Verse 1</div>');
    expect(html.match(/class="sheet-view-line/g)).toHaveLength(4);
    expect(html).not.toContain("Verse 2");
  });

  // Scenario "Screen reader".
  it("is a part named Sample sheet that screen readers read", () => {
    const html = renderToString(<SampleSheet />);
    expect(html).toMatch(
      /^<section class="sample-sheet" aria-label="Sample sheet">/,
    );
    // Only the icons are hidden.
    expect(html).not.toMatch(/<(?!svg)[a-z]+ [^>]*aria-hidden/);
  });
});
