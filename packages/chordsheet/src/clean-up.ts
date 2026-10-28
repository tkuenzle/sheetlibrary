import { isBlank } from "./check";
import type { Line, Section } from "./sheet";

// Cleans up a section after editing: drops spaces from each line, then
// drops empty lines, and cleans up the label. Returns undefined when no line
// is left, meaning the section is removed.
export function cleanUpSection(section: Section): Section | undefined {
  const lines = section.lines.map(dropSpaces).filter((line) => !isEmpty(line));
  if (lines.length === 0) return undefined;
  const cleaned: Section = { ...section, lines };
  const label = cleanUpLabel(section.label);
  if (label === undefined) delete cleaned.label;
  else cleaned.label = label;
  return cleaned;
}

// Drops spaces at both ends of a label and makes each run of spaces inside
// it one space. Returns undefined when nothing is left, meaning no label.
export function cleanUpLabel(label: string | undefined): string | undefined {
  const cleaned = label?.replace(/\s+/g, " ").trim();
  return cleaned === "" ? undefined : cleaned;
}

// The positions of the spaces that clean-up drops from a line, in order:
// all spaces at both ends, and inside the line all but one space of each
// run. In a run with chords, only the spaces with chords stay. A space with
// a chord always stays.
export function spacesToDrop(line: Line): number[] {
  const { text } = line;
  const taken = new Set(line.chords.map((chord) => chord.at));
  const dropped: number[] = [];
  let start = 0;
  while (start < text.length) {
    if (!isSpace(text, start)) {
      start++;
      continue;
    }
    let end = start;
    while (end < text.length && isSpace(text, end)) end++;
    const run = Array.from({ length: end - start }, (_, i) => start + i);
    const free = run.filter((at) => !taken.has(at));
    const atEdge = start === 0 || end === text.length;
    // A run inside the line without chords keeps its first space.
    const keepOne = !atEdge && free.length === run.length;
    dropped.push(...(keepOne ? free.slice(1) : free));
    start = end;
  }
  return dropped;
}

function dropSpaces(line: Line): Line {
  const dropped = spacesToDrop(line);
  if (dropped.length === 0) return line;
  const gone = new Set(dropped);
  return {
    // Positions count UTF-16 code units, and only spaces go, so surrogate
    // pairs stay whole.
    text: line.text
      .split("")
      .filter((_, at) => !gone.has(at))
      .join(""),
    // A chord moves left by the number of spaces dropped before it.
    chords: line.chords.map((chord) => ({
      ...chord,
      at: chord.at - dropped.filter((d) => d < chord.at).length,
    })),
  };
}

function isSpace(text: string, at: number) {
  return /\s/.test(text.charAt(at));
}

function isEmpty(line: Line): boolean {
  return line.chords.length === 0 && isBlank(line.text);
}
