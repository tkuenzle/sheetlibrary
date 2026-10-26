import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { iconPaths } from "../ui/icons";
import { SectionToolbar } from "./section-toolbar";

function nothing() {
  return undefined;
}

function render(state: Parameters<typeof SectionToolbar>[0]["state"]) {
  return renderToString(
    <SectionToolbar state={state} onAddChord={nothing} onMove={nothing} />,
  );
}

function button(html: string, name: string) {
  return new RegExp(`<button[^>]*aria-label="${name}"[^>]*>`).exec(html)?.[0];
}

describe("SectionToolbar", () => {
  it("is hidden while no section is active", () => {
    expect(render(null)).toMatch(/^<div class="section-toolbar" hidden="">/);
  });

  it("disables moving the first section up", () => {
    const html = render({ index: 0, count: 3, docked: false });
    expect(button(html, "Add chord")).toBeDefined();
    expect(button(html, "Move section up")).toContain("disabled");
    expect(button(html, "Move section down")).not.toContain("disabled");
  });

  it("has no move buttons with a single section", () => {
    const html = render({ index: 0, count: 1, docked: false });
    expect(button(html, "Add chord")).toBeDefined();
    expect(button(html, "Move section up")).toBeUndefined();
    expect(render({ index: 0, count: 1, docked: true })).not.toContain("Move");
  });

  it("uses the move icons, not plain arrows", () => {
    for (const docked of [false, true]) {
      const html = render({ index: 1, count: 3, docked });
      expect(html).toMatch(
        new RegExp(
          `aria-label="Move section up"[^>]*><svg[^>]*><path d="${iconPaths.moveUp}"`,
        ),
      );
      expect(html).toMatch(
        new RegExp(
          `aria-label="Move section down"[^>]*><svg[^>]*><path d="${iconPaths.moveDown}"`,
        ),
      );
    }
  });

  it("labels the move buttons when docked", () => {
    const html = render({ index: 1, count: 2, docked: true });
    expect(html).toContain('aria-label="Section 2 of 2"');
    expect(html).toMatch(/>Move<\/span>/);
    // The section's place is only in the toolbar's name, not shown.
    expect(html).not.toMatch(/>[^<]*\bof\b/);
    expect(html).toMatch(/aria-label="Add chord"[^>]*>.*?Chord<\/button>/);
    expect(button(html, "Move section down")).toContain("disabled");
  });
});
