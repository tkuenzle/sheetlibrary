import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { seedSong } from "../editor/seed-song";
import { SheetView } from "./sheet-view";
import { sheet } from "./test-sheets";

describe("SheetView", () => {
  it("renders the sheet as HTML, without scripts", () => {
    const html = renderToString(<SheetView sheet={seedSong} />);
    expect(html).toContain('<div class="sheet-view-label">Verse 1</div>');
    expect(html).toContain('<span class="sheet-view-chord">G7</span>');
    expect(html).toContain('<span class="sheet-view-text">wretch </span>');
    expect(html).not.toContain("<script");
  });

  it("passes the sizes the layout worked with to the CSS", () => {
    const html = renderToString(<SheetView sheet={seedSong} />);
    expect(html).toContain(
      "--sheet-view-chord-size:0.75em;--sheet-view-chord-space:0.4em",
    );
  });

  it("takes a font size, which every other size follows", () => {
    const html = renderToString(
      <SheetView sheet={seedSong} fontSize="calc(24px * 1.15)" />,
    );
    expect(html).toContain("--sheet-view-font-size:calc(24px * 1.15)");
    expect(renderToString(<SheetView sheet={seedSong} />)).not.toContain(
      "--sheet-view-font-size",
    );
  });

  it("marks a line of chords only", () => {
    const html = renderToString(
      <SheetView sheet={sheet(["Intro", "[G][C]", "Amazing"])} />,
    );
    expect(html).toContain('class="sheet-view-line is-chords-only"');
    expect(html.match(/is-chords-only/g)).toHaveLength(1);
  });

  it("gives a tight piece inside a word its dash and room", () => {
    const html = renderToString(
      <SheetView sheet={sheet([null, "Hal[F]le[Am]lu[F]jah"])} />,
    );
    expect(html).toMatch(
      /<span class="sheet-view-piece has-dash" style="min-width:[\d.]+em">/,
    );
  });
});
