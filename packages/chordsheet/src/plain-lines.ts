import type { ChordSheet } from "./sheet";

// The library marks search matches with these private-use characters, so a
// sheet's text must not hold them.
const MARKERS = /[\uE000\uE001]/g;

// The lyrics as plain text: each line's text, in order, without chords or
// labels. Lines with only chords are left out.
export function plainLines(content: ChordSheet): string[] {
  return content.sections.flatMap((section) =>
    section.lines
      .map((line) => line.text.replace(MARKERS, ""))
      .filter((text) => text.trim() !== ""),
  );
}
