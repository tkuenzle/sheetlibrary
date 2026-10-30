// Ultimate Guitar: text copied from an Ultimate Guitar page, with chord
// lines above the lyrics and headers such as "[Verse 1]", read into a chord
// sheet.

import { eastAsianWidth } from "get-east-asian-width";

import type { MarkedChord } from "./chord-mark";
import { type ChordSymbol, readChord } from "./chord-symbol";
import { cleanUpLabel, cleanUpSection } from "./clean-up";
import {
  type ChordSheet,
  FORMAT,
  LABEL_MAX,
  type Line,
  type Section,
  VERSION,
} from "./sheet";

// A chord on a chord line, at the column its first character is in.
interface Placed {
  column: number;
  symbol: MarkedChord;
  // Written in round brackets, such as "(C)": held or optional, by the
  // chord before it.
  bracketed?: boolean;
}

type UgLine =
  | { kind: "blank" }
  | { kind: "header"; label: string }
  | { kind: "tab" }
  | { kind: "chords"; chords: Placed[]; repeat?: string }
  | { kind: "lyrics"; text: string };

// A string name, then a bar, then the frets: "e|---3---|". The name can be
// left out, but the frets need dashes, so a chord line such as "|G |D |"
// is not a tab.
const TAB = /^\s*(?:[A-Ga-g][#b]?)?\s*\|.*--/;
const HEADER = /^\s*\[([^[\]]+)\]\s*$/;
const REPEAT = /^\(?(?:x\d+|\d+x)\)?$/i;
const NO_CHORD = /^\(?N\.?C\.?\)?$/i;
const BRACKETED = /^\((.+)\)$/;

// Reads text copied from an Ultimate Guitar page. Any text gives a valid
// sheet, maybe without sections.
export function readUltimateGuitar(text: string): ChordSheet {
  const lines = text
    .normalize("NFC")
    .split(/\r\n?|\n/)
    .map(classify);
  markBracketed(lines);
  return { format: FORMAT, version: VERSION, sections: group(lines) };
}

function classify(line: string): UgLine {
  if (line.trim() === "") return { kind: "blank" };
  const header = HEADER.exec(line)?.[1];
  const label = header === undefined ? undefined : cleanUpLabel(header);
  if (label !== undefined) return { kind: "header", label: cutLabel(label) };
  if (TAB.test(line)) return { kind: "tab" };
  return readChordLine(line) ?? { kind: "lyrics", text: line };
}

// Cuts a label to the longest one a section can have, without splitting a
// character.
function cutLabel(label: string): string {
  if (label.length <= LABEL_MAX) return label;
  const cut = label.slice(0, LABEL_MAX);
  const end = cut.charCodeAt(cut.length - 1);
  const whole = end >= 0xd800 && end <= 0xdbff ? cut.slice(0, -1) : cut;
  return whole.trimEnd();
}

// A chord line holds chords, chords in round brackets, bars, repeat counts
// and "N.C.", and at least one chord. Anything else makes it a lyrics line.
function readChordLine(line: string): UgLine | undefined {
  const columns = columnsOf(line);
  const chords: Placed[] = [];
  let repeat: string | undefined;
  // A bar is a word of its own, even when it touches a chord: "|G".
  for (const word of line.matchAll(/\||[^\s|]+/g)) {
    const typed = word[0];
    if (typed === "|" || NO_CHORD.test(typed)) continue;
    if (REPEAT.test(typed)) {
      repeat = typed;
      continue;
    }
    const column = columns[word.index] ?? 0;
    const symbol = readChord(typed);
    if (symbol) {
      chords.push({ column, symbol });
      continue;
    }
    const inner = BRACKETED.exec(typed)?.[1];
    const held = inner === undefined ? null : readChord(inner);
    if (!held) return undefined;
    chords.push({ column, symbol: held, bracketed: true });
  }
  if (chords.length === 0) return undefined;
  return repeat === undefined
    ? { kind: "chords", chords }
    : { kind: "chords", chords, repeat };
}

// Marks each chord in round brackets: held when the chord before it, in any
// earlier line, is the same chord, and optional otherwise.
function markBracketed(lines: UgLine[]) {
  let previous: ChordSymbol | undefined;
  for (const line of lines) {
    if (line.kind !== "chords") continue;
    for (const placed of line.chords) {
      if (placed.bracketed) {
        const held =
          previous !== undefined && sameChord(placed.symbol, previous);
        placed.symbol = { ...placed.symbol, mark: held ? "held" : "optional" };
      }
      previous = placed.symbol;
    }
  }
}

function sameChord(a: ChordSymbol, b: ChordSymbol): boolean {
  return a.root === b.root && a.suffix === b.suffix && a.bass === b.bass;
}

// The column each UTF-16 index of the text starts at, as Ultimate Guitar
// lays it out in a monospace font: wide letters, such as Chinese or
// Japanese, take two columns. The last entry is the width of the text.
function columnsOf(text: string): number[] {
  const columns: number[] = [];
  let column = 0;
  for (const letter of text) {
    // A surrogate pair has two indexes, both in the letter's column.
    columns.push(...Array<number>(letter.length).fill(column));
    column += eastAsianWidth(letter.codePointAt(0) ?? 0, {
      ambiguousAsWide: false,
    });
  }
  columns.push(column);
  return columns;
}

// Puts each chord on the letter of the lyrics under its column. Chords past
// the end go after it, each on a space of its own, and the last one at the
// end of the text, as the editor hands back a line.
function placeChords(chords: Placed[], lyrics: string): Line {
  const columns = columnsOf(lyrics);
  const width = columns[lyrics.length] ?? 0;
  const ats = chords.map(({ column }) => {
    if (column >= width) return lyrics.length + column - width;
    // The letter that covers the column, whole letters at a time, so a
    // surrogate pair stays whole.
    let at = 0;
    for (const letter of lyrics) {
      if ((columns[at + letter.length] ?? width) > column) break;
      at += letter.length;
    }
    return at;
  });
  const last = ats.at(-1) ?? 0;
  return {
    text: last > lyrics.length ? lyrics.padEnd(last) : lyrics,
    chords: chords.map(({ symbol }, i) => ({ at: ats[i] ?? 0, ...symbol })),
  };
}

// A line of chords only: a space for each chord, then the repeat count.
function chordsOnly(chords: Placed[], repeat?: string): Line {
  const spaces = " ".repeat(chords.length - 1);
  return {
    text: repeat === undefined ? spaces : `${spaces} ${repeat}`,
    chords: chords.map(({ symbol }, at) => ({ at, ...symbol })),
  };
}

// The sections a header started: its own, and those without a label that
// followed it up to the next header.
interface Group {
  label: string;
  sections: Section[];
}

function group(lines: UgLine[]): Section[] {
  const sections: Section[] = [];
  // The last group with sections for each label, for a header that repeats it.
  const groups = new Map<string, Section[]>();
  let current: Section = { lines: [] };
  let header: Group | undefined;

  function endSection() {
    const cleaned = cleanUpSection(current);
    if (cleaned) {
      sections.push(cleaned);
      header?.sections.push(cleaned);
    }
  }

  function endGroup() {
    endSection();
    if (!header) return;
    if (header.sections.length > 0) {
      groups.set(header.label, header.sections);
    } else {
      sections.push(...(groups.get(header.label) ?? []).map(copySection));
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    switch (line?.kind) {
      case "blank":
        // Blank lines at the start of a section are skipped.
        if (current.lines.length === 0) break;
        endSection();
        current = { lines: [] };
        break;
      case "header":
        endGroup();
        header = { label: line.label, sections: [] };
        current = { label: line.label, lines: [] };
        break;
      case "chords": {
        const next = lines[i + 1];
        if (next?.kind === "lyrics") {
          current.lines.push(placeChords(line.chords, next.text));
          i++;
        } else {
          current.lines.push(chordsOnly(line.chords, line.repeat));
        }
        break;
      }
      case "lyrics":
        current.lines.push({ text: line.text, chords: [] });
        break;
      default:
        break;
    }
  }
  endGroup();
  return sections;
}

function copySection(section: Section): Section {
  return {
    ...section,
    lines: section.lines.map((line) => ({
      text: line.text,
      chords: line.chords.map((chord) => ({ ...chord })),
    })),
  };
}
