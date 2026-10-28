import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  labelSuggestions,
  SectionLabelField,
  suggestionsFor,
} from "./section-label-field";

function nothing() {
  return undefined;
}

function render(initial: string) {
  return renderToString(
    <SectionLabelField
      left={0}
      top={0}
      height={32}
      initial={initial}
      onKeep={nothing}
      onCancel={nothing}
    />,
  );
}

function options(html: string) {
  return [...html.matchAll(/<li[^>]*role="option"[^>]*>([^<]*)<\/li>/g)].map(
    (match) => match[1],
  );
}

describe("suggestionsFor", () => {
  it("suggests every part while nothing is typed", () => {
    expect(suggestionsFor("")).toEqual(labelSuggestions);
    expect(suggestionsFor("  ")).toEqual(labelSuggestions);
  });

  it("narrows to the parts that contain the text, ignoring case", () => {
    expect(suggestionsFor("ch")).toEqual(["Pre-chorus", "Chorus"]);
    expect(suggestionsFor("VERSE")).toEqual(["Verse"]);
    expect(suggestionsFor("Verse 2")).toEqual([]);
  });
});

describe("SectionLabelField", () => {
  it("is a combobox named Label that takes at most 40 characters", () => {
    const html = render("Verse 2");
    expect(html).toMatch(/<input[^>]*role="combobox"/);
    expect(html).toContain('aria-label="Label"');
    expect(html).toContain('maxLength="40"');
    expect(html).toContain('value="Verse 2"');
  });

  it("suggests every part when it opens, also over a label", () => {
    expect(options(render("Verse 2"))).toEqual(labelSuggestions);
    expect(options(render(""))).toEqual(labelSuggestions);
  });
});
