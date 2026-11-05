// The photo answer: what a vision model answers when it reads photos of a
// song, in a format that looks like ChordPro, read into a chord sheet. The
// format is internal and never stored; the prompt that asks for it is in
// photo-answer-prompt.ts, and the two change together.

import { readMarkedChord } from "./chord-mark";
import { cleanUpLabel, cleanUpSection, cutLabel } from "./clean-up";
import {
  type ChordSheet,
  FORMAT,
  type Line,
  type Section,
  VERSION,
} from "./sheet";

// What an answer gives: the content of a sheet, and the details for its
// envelope. A detail the answer doesn't have is left out.
export interface PhotoAnswer {
  title?: string;
  artist?: string;
  content: ChordSheet;
}

type AnswerLine =
  | { kind: "blank" }
  | { kind: "directive"; name: string; value?: string }
  | { kind: "lyrics"; line: Line };

// A whole line in braces: "{start_of_verse: Verse 1}" or "{end_of_verse}".
const DIRECTIVE = /^\s*\{([^:}]*)(?::(.*))?\}\s*$/;

// Reads a photo answer. Any text gives a valid sheet, maybe without
// sections.
export function readPhotoAnswer(text: string): PhotoAnswer {
  const lines = text
    .normalize("NFC")
    .split(/\r\n?|\n/)
    .map(classify);
  const answer: PhotoAnswer = {
    content: { format: FORMAT, version: VERSION, sections: group(lines) },
  };
  const title = detail(lines, "title");
  if (title !== undefined) answer.title = title;
  const artist = detail(lines, "artist");
  if (artist !== undefined) answer.artist = artist;
  return answer;
}

function classify(line: string): AnswerLine {
  if (line.trim() === "") return { kind: "blank" };
  const directive = DIRECTIVE.exec(line);
  if (directive) {
    const name = (directive[1] ?? "").trim().toLowerCase();
    const value = directive[2];
    return value === undefined
      ? { kind: "directive", name }
      : { kind: "directive", name, value };
  }
  return { kind: "lyrics", line: readInline(line) };
}

// Reads a line with chords in square brackets before the text they sit on:
// "A[D]mazing [G]grace". The text inside the brackets is read as the app
// reads typed chords, so "[(C)]" is held and "[[C]]" optional. A bracket
// that isn't a chord, such as "[N.C.]", is dropped. A "[" that is never
// closed stays as text.
function readInline(source: string): Line {
  const line: Line = { text: "", chords: [] };
  let i = 0;
  while (i < source.length) {
    const open = source.indexOf("[", i);
    if (open === -1) break;
    const close = closingBracket(source, open);
    if (close === -1) break;
    line.text += source.slice(i, open);
    const chord = readMarkedChord(source.slice(open + 1, close));
    if (chord) line.chords.push({ at: line.text.length, ...chord });
    i = close + 1;
  }
  line.text += source.slice(i);
  return line;
}

// The index of the "]" that closes the bracket at `open`: the second of
// "]]" for an optional chord such as "[[C]]", otherwise the first "]".
function closingBracket(source: string, open: number): number {
  if (source[open + 1] === "[") {
    const double = source.indexOf("]]", open + 2);
    if (double !== -1) return double + 1;
  }
  return source.indexOf("]", open + 1);
}

// The first value of a directive such as "{title: …}", cleaned up as a
// label is.
function detail(lines: AnswerLine[], name: string): string | undefined {
  for (const line of lines) {
    if (line.kind !== "directive" || line.name !== name) continue;
    const value = cleanUpLabel(line.value);
    if (value !== undefined) return value;
  }
  return undefined;
}

// Groups lines into sections. "{start_of_…}" starts a section, labeled with
// its value, and "{end_of_…}" ends it. Lines outside any section form a
// section without a label. Blank lines and other directives are dropped.
function group(lines: AnswerLine[]): Section[] {
  const sections: Section[] = [];
  let current: Section = { lines: [] };

  function endSection() {
    const cleaned = cleanUpSection(current);
    if (cleaned) sections.push(cleaned);
  }

  for (const line of lines) {
    if (line.kind === "lyrics") {
      current.lines.push(line.line);
    } else if (line.kind === "directive") {
      if (line.name.startsWith("start_of_")) {
        endSection();
        const label = cleanUpLabel(line.value);
        current =
          label === undefined
            ? { lines: [] }
            : { label: cutLabel(label), lines: [] };
      } else if (line.name.startsWith("end_of_")) {
        endSection();
        current = { lines: [] };
      }
    }
  }
  endSection();
  return sections;
}
