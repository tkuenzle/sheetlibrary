import { describe, expect, it } from "vitest";

import { readPhotoAnswer } from "./photo-answer";
import { PHOTO_ANSWER_PROMPT } from "./photo-answer-prompt";
import type { Line } from "./sheet";
import { line } from "./test-helpers";

// Everything the prompt writes in backticks.
const spans = [...PHOTO_ANSWER_PROMPT.matchAll(/`([^`]+)`/g)].map(
  (match) => match[1] ?? "",
);

// How each example with chords reads, as the prompt describes it. A new
// example in the prompt needs an entry here.
const examples: Record<string, Line> = {
  "A[D]mazing [G]grace": line("Amazing grace", [1, "D"], [8, "G"]),
  "grace[D7] how": line("grace how", [5, "D7"]),
  "[C] [G] [C]": line("  ", [0, "C"], [1, "G"], [2, "C"]),
  "[(C)]": line("", [0, "(C)"]),
  "[[C]]": line("", [0, "[C]"]),
  "[D] [A] [Bm] [G] x2": line(
    "    x2",
    [0, "D"],
    [1, "A"],
    [2, "Bm"],
    [3, "G"],
  ),
};

// The directives the reader keeps.
const KEPT = /^(title|artist|start_of_\w+|end_of_\w+)$/;

describe("The prompt's examples", () => {
  const withChords = spans.filter((span) => span.includes("["));

  it("each have a reading here", () => {
    expect(withChords.toSorted()).toEqual(Object.keys(examples).toSorted());
  });

  for (const [example, expected] of Object.entries(examples)) {
    it(`read ${example} as described`, () => {
      expect(readPhotoAnswer(example).content.sections).toEqual([
        { lines: [expected] },
      ]);
    });
  }
});

describe("The prompt's directives", () => {
  const directives = spans.filter((span) => span.startsWith("{"));

  it("are only ones the reader keeps", () => {
    expect(directives.length).toBeGreaterThan(0);
    for (const directive of directives) {
      const name = /^\{([^:}]+)/.exec(directive)?.[1]?.trim() ?? "";
      expect(name, directive).toMatch(KEPT);
    }
  });

  it("start labeled sections", () => {
    for (const directive of directives.filter((d) =>
      d.startsWith("{start_of_"),
    )) {
      const label = /:\s*(.+)\}$/.exec(directive)?.[1];
      const { sections } = readPhotoAnswer(`${directive}\nla`).content;
      expect(sections, directive).toEqual([{ label, lines: [line("la")] }]);
    }
  });
});
