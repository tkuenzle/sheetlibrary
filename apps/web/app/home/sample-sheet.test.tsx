import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { seedSong } from "../editor/seed-song";
import { SampleSheet, sampleSheet } from "./sample-sheet";

describe("SampleSheet", () => {
  it("is the seed song's first section", () => {
    expect(sampleSheet.sections).toEqual([seedSong.sections[0]]);
    expect(sampleSheet.sections[0]?.label).toBe("Verse 1");
  });

  it("shows it in the sheet view, with its label", () => {
    const html = renderToString(<SampleSheet />);
    expect(html).toContain('<div class="sheet-view"');
    expect(html).toContain('<div class="sheet-view-label">Verse 1</div>');
    expect(html).not.toContain("Verse 2");
  });

  it("is hidden from screen readers", () => {
    expect(renderToString(<SampleSheet />)).toMatch(
      /^<div class="sample-sheet" aria-hidden="true">/,
    );
  });
});
